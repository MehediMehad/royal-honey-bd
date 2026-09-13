import { z } from 'zod';

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('অনুগ্রহ করে একটি সঠিক ইমেইল অ্যাড্রেস দিন'),
    password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  }),
});

const refreshTokenSchema = z.object({
  cookies: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
});

export const AuthValidations = {
  loginSchema,
  refreshTokenSchema,
};

export const AuthValidation = AuthValidations;
