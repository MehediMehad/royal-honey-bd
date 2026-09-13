import { z } from "zod";

export const envSchema = z.object({
  // Node / App Environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Public Client Variables (Must be prefixed with NEXT_PUBLIC_)
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000")
    .catch("http://localhost:3000"),

  NEXT_PUBLIC_API_URL: z
    .string()
    .url("NEXT_PUBLIC_API_URL must be a valid URL")
    .default("http://localhost:5000/api/v1")
    .catch("http://localhost:5000/api/v1"),

  NEXT_PUBLIC_SOCKET_URL: z
    .string()
    .url("NEXT_PUBLIC_SOCKET_URL must be a valid URL")
    .default("http://localhost:5000")
    .catch("http://localhost:5000"),

  // Server-Only Variables (Never exposed to the client)
  API_SECRET_KEY: z.string().optional(),
});

export type EnvSchema = z.infer<typeof envSchema>;
