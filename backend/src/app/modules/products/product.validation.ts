import { z } from 'zod';

const createProductSchema = z.object({
  id: z.string().min(2, 'Product ID (e.g. sundarban_500g) is required'),
  name: z.string().min(2, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  weight: z.string().min(1, 'Weight/unit is required'),
  stockCount: z.number().int().min(0).optional().default(100),
  minThreshold: z.number().int().min(0).optional().default(10),
  description: z.string().optional(),
  isAvailable: z.boolean().optional().default(true),
  imageUrl: z.string().url().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().positive().optional(),
  weight: z.string().min(1).optional(),
  stockCount: z.number().int().min(0).optional(),
  minThreshold: z.number().int().min(0).optional(),
  description: z.string().optional(),
  isAvailable: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
});

const restockProductSchema = z.object({
  quantityAdded: z
    .number()
    .int()
    .positive('Quantity added must be greater than 0'),
  note: z.string().optional(),
});

export const ProductValidations = {
  createProductSchema,
  updateProductSchema,
  restockProductSchema,
};
