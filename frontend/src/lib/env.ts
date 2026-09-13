import { envSchema } from "./validations/env.schema";

/**
 * Validates and exposes environment variables with strict runtime type safety.
 * Server-only variables are strictly hidden on the client side.
 */
const _env = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  API_SECRET_KEY: process.env.API_SECRET_KEY,
});

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables setup");
}

const parsed = _env.data;

export const env = {
  ...parsed,
  // Intuitive developer aliases
  API_URL: parsed.NEXT_PUBLIC_API_URL.replace(/\/+$/, ""),
  APP_URL: parsed.NEXT_PUBLIC_APP_URL.replace(/\/+$/, ""),
  isProduction: parsed.NODE_ENV === "production",
  isDevelopment: parsed.NODE_ENV === "development",
  isTest: parsed.NODE_ENV === "test",
} as const;

export type Env = typeof env;
export default env;
