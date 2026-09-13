"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/auth.service";
import { tokenStorage } from "@/lib/api";
import { LoginInput } from "@/lib/validations/auth.schema";
import { ApiResponse, LoginResponseData, User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<ApiResponse<LoginResponseData>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem("auth_user");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const token = tokenStorage.getAccessToken();
      const cached = getInitialUser();
      if (token && cached) return false;
    }
    return true;
  });

  const refreshUser = async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user");
      }
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      if (response.success && response.data) {
        setUser(response.data);
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(response.data));
        }
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_user");
        }
        tokenStorage.removeAccessToken();
      }
    } catch {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user");
      }
      tokenStorage.removeAccessToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        if (isMounted) {
          setUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_user");
          }
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await authService.getMe();
        if (isMounted) {
          if (response.success && response.data) {
            setUser(response.data);
            if (typeof window !== "undefined") {
              localStorage.setItem("auth_user", JSON.stringify(response.data));
            }
          } else {
            setUser(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem("auth_user");
            }
            tokenStorage.removeAccessToken();
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_user");
          }
          tokenStorage.removeAccessToken();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (
    data: LoginInput
  ): Promise<ApiResponse<LoginResponseData>> => {
    const response = await authService.login(data);
    const resData = response.data as any;
    const token = resData?.tokens?.accessToken || resData?.accessToken;
    const currentUser = resData?.admin || resData?.user;

    if (response.success && token) {
      tokenStorage.setAccessToken(token);
      if (currentUser) {
        setUser(currentUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(currentUser));
        }
      } else {
        await refreshUser();
      }
    }
    return response;
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore API logout errors and proceed with client state cleanup
    } finally {
      tokenStorage.removeAccessToken();
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user");
      }
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const defaultAuthValue: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {
    throw new Error("AuthProvider is not mounted");
  },
  logout: async () => {},
  refreshUser: async () => {},
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthValue;
  }
  return context;
}
