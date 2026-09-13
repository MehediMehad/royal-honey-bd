import { z } from 'zod';

export const bangladeshPhoneRegex = /^(?:8801|01)[3-9]\d{8}$/;

export const phoneSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s-+]/g, ''))
  .refine((val) => bangladeshPhoneRegex.test(val), {
    message: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)',
  });

export const customerShippingZodSchema = z.object({
  name: z.string().trim().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  phone: phoneSchema,
  district: z.string().trim().min(2, 'জেলার নাম লিখুন'),
  thana: z.string().trim().optional(),
  fullAddress: z.string().trim().min(5, 'পূর্ণ ডেলিভারি ঠিকানা দিন (বাড়ি/রোড/এলাকা)'),
});

export const createOrderZodSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD'] as const),
    transactionId: z.string().trim().optional(),
    paymentProofUrl: z.string().url('Invalid proof URL').optional(),
    notes: z.string().optional(),
  }),
});

export const verifyPaymentZodSchema = z.object({
  body: z.object({
    transactionId: z.string().trim().optional(),
    note: z.string().trim().optional(),
  }),
});

export const updateOrderStatusZodSchema = z.object({
  body: z.object({
    orderStatus: z.enum([
      'PENDING',
      'PAYMENT_VERIFICATION_PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ] as const),
    notes: z.string().optional(),
  }),
});

export const OrderValidations = {
  phoneSchema,
  customerShippingZodSchema,
  createOrderZodSchema,
  verifyPaymentZodSchema,
  updateOrderStatusZodSchema,
};

