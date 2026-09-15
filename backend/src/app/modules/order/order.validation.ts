import { z } from 'zod';

export const bangladeshPhoneRegex = /^01[3-9]\d{8}$/;

const createOrderZodSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    name: z.string().min(2, 'নাম দিন').optional(),
    phone: z.string().regex(bangladeshPhoneRegex, '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন').optional(),
    fullAddress: z.string().min(5, 'সম্পূর্ণ ঠিকানা দিন').optional(),
    district: z.string().min(2, 'জেলা দিন').optional(),
    thana: z.string().optional(),
    paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD']).default('COD'),
    transactionId: z.string().optional(),
    paymentProofUrl: z.string().optional(),
    notes: z.string().optional(),
    items: z
      .array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
        }),
      )
      .optional(),
  }),
});

const orderStatusEnum = z.enum([
  'PENDING',
  'PAYMENT_VERIFICATION_PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

const updateOrderStatusZodSchema = z.object({
  body: z
    .object({
      status: orderStatusEnum.optional(),
      orderStatus: orderStatusEnum.optional(),
      notes: z.string().optional(),
    })
    .refine((data) => !!(data.status || data.orderStatus), {
      message: 'status অথবা orderStatus প্রদান করুন',
    }),
});

const verifyPaymentZodSchema = z.object({
  body: z
    .object({
      status: z.enum(['PAID', 'REJECTED', 'APPROVE', 'REJECT']).optional(),
      action: z.enum(['APPROVE', 'REJECT', 'PAID', 'REJECTED']).optional(),
      adminNotes: z.string().optional(),
      notes: z.string().optional(),
      note: z.string().optional(),
      transactionId: z.string().optional(),
    })
    .refine((data) => !!(data.status || data.action), {
      message: 'status অথবা action প্রদান করুন (PAID/REJECTED বা APPROVE/REJECT)',
    }),
});

export const OrderValidations = {
  createOrderZodSchema,
  updateOrderStatusZodSchema,
  verifyPaymentZodSchema,
  updateOrderStatusSchema: updateOrderStatusZodSchema,
  verifyPaymentSchema: verifyPaymentZodSchema,
};

export const OrderValidation = OrderValidations;
