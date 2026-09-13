import Cookies from "js-cookie";
import { env } from "@/lib/env";

const ACCESS_TOKEN_KEY = "access_token";
const DEVICE_ID_KEY = "device_id";

export const tokenStorage = {
  getAccessToken(): string | undefined {
    if (typeof window === "undefined") return undefined;
    return Cookies.get(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string, expiresDays = 7): void {
    if (typeof window === "undefined") return;
    Cookies.set(ACCESS_TOKEN_KEY, token, {
      expires: expiresDays,
      sameSite: "strict",
      secure: env.isProduction,
    });
  },

  removeAccessToken(): void {
    if (typeof window === "undefined") return;
    Cookies.remove(ACCESS_TOKEN_KEY);
  },

  getDeviceId(): string {
    if (typeof window === "undefined") return "browser-device";
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `web-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  },
};
