import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters long")
  .max(50, "Password must be at most 50 characters long");

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
