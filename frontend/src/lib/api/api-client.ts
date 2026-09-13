import { tokenStorage } from "./token";
import { ApiResponse } from "@/types";
import { env } from "@/lib/env";

const BASE_URL = env.API_URL;

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  requiresAuth?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

async function refreshAccessToken(): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const json = (await res.json()) as ApiResponse<{ accessToken: string }>;
    if (!res.ok || !json.success || !json.data?.accessToken) {
      throw new Error(json.message || "Failed to refresh token");
    }

    const newAccessToken = json.data.accessToken;
    tokenStorage.setAccessToken(newAccessToken);
    return newAccessToken;
  } catch (err) {
    tokenStorage.removeAccessToken();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
    throw err;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, requiresAuth = true, headers: customHeaders, ...customConfig } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-device-id": tokenStorage.getDeviceId(),
    ...(customHeaders as Record<string, string>),
  };

  const token = tokenStorage.getAccessToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
    credentials: "include",
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  let response = await fetch(url, config);

  // Handle 401 Unauthorized (Auto Token Refresh)
  if (
    response.status === 401 &&
    requiresAuth &&
    !endpoint.includes("/auth/refresh-token")
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newAccessToken = await refreshAccessToken();
        isRefreshing = false;
        processQueue(null, newAccessToken);

        // Retry initial request with new access token
        headers["Authorization"] = `Bearer ${newAccessToken}`;
        response = await fetch(url, { ...config, headers });
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr as Error, null);
        throw refreshErr;
      }
    } else {
      // Queue request while token is refreshing
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            headers["Authorization"] = `Bearer ${newToken}`;
            fetch(url, { ...config, headers })
              .then((res) => res.json())
              .then(resolve)
              .catch(reject);
          },
          reject,
        });
      });
    }
  }

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new ApiError(
      data.message || "An unexpected error occurred",
      response.status,
      data.data
    );
  }

  return data;
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestOptions) {
    return fetchApi<T>(endpoint, { ...options, method: "GET" });
  },
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return fetchApi<T>(endpoint, { ...options, method: "POST", body });
  },
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return fetchApi<T>(endpoint, { ...options, method: "PUT", body });
  },
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return fetchApi<T>(endpoint, { ...options, method: "PATCH", body });
  },
  delete<T>(endpoint: string, options?: RequestOptions) {
    return fetchApi<T>(endpoint, { ...options, method: "DELETE" });
  },
};
