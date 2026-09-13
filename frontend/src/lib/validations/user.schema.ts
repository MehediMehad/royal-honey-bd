import { z } from "zod";
import { emailSchema } from "./common.schema";

export const userProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  email: emailSchema,
  phone: z.string().optional(),
  bio: z.string().trim().max(300, "Bio must not exceed 300 characters").optional(),
  avatarUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

export const userRoleSchema = z.enum(["OWNER", "SUPPORT_AGENT", "ADMIN"]);

export type UserRole = z.infer<typeof userRoleSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  role: userRoleSchema,
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
