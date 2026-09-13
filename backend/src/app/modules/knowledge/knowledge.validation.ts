import { z } from 'zod';

const knowledgeCategories = [
  'FAQ',
  'POLICY',
  'HONEY_GUIDE',
  'ANNOUNCEMENT',
] as const;

const createKnowledgeSchema = z.object({
  question: z.string().min(2, 'Question/title is required'),
  answer: z.string().min(5, 'Answer/content is required'),
  category: z.enum(knowledgeCategories).optional().default('FAQ'),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional().default(true),
});

const updateKnowledgeSchema = z.object({
  question: z.string().min(2).optional(),
  answer: z.string().min(5).optional(),
  category: z.enum(knowledgeCategories).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

const searchKnowledgeSchema = z.object({
  query: z.string().min(1, 'Search query string is required'),
  category: z.enum(knowledgeCategories).optional(),
  topK: z.number().int().positive().optional().default(4),
  minSimilarity: z.number().min(0).max(1).optional().default(0.3),
});

export const KnowledgeValidations = {
  createKnowledgeSchema,
  updateKnowledgeSchema,
  searchKnowledgeSchema,
};
