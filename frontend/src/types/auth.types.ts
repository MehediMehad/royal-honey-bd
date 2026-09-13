import { User } from "./user.types";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface UserDevice {
  id: string;
  deviceId: string;
  deviceName?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  lastActiveAt: string;
  isCurrent?: boolean;
}

export interface LoginResponseData {
  user?: User;
  tokens?: AuthTokens;
  code?: "DEVICE_LIMIT_REACHED";
  pendingToken?: string;
  devices?: UserDevice[];
}

export interface RegisterResponseData {
  user?: User;
  requireVerification?: boolean;
  message?: string;
}

export type OtpType =
  | "LOGIN"
  | "FORGOT_PASSWORD"
  | "VERIFY_EMAIL"
  | "RESET_PASSWORD"
  | "VERIFY_PHONE"
  | "VERIFY_USER";
