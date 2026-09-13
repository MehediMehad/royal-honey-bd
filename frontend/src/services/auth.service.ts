import { apiClient } from "@/lib/api";
import { ChangePasswordInput, LoginInput } from "@/lib/validations/auth.schema";
import { ApiResponse, LoginResponseData, User } from "@/types";

export const authService = {
  async login(data: LoginInput): Promise<ApiResponse<LoginResponseData>> {
    return apiClient.post<LoginResponseData>("/auth/login", data, {
      requiresAuth: false,
    });
  },

  async logout(): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>("/auth/logout", undefined, {
      requiresAuth: true,
    });
  },

  async getMe(): Promise<ApiResponse<User>> {
    return apiClient.get<User>("/auth/me", {
      requiresAuth: true,
    });
  },

  async changePassword(data: ChangePasswordInput): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>("/auth/change-password", data, {
      requiresAuth: true,
    });
  },
};
