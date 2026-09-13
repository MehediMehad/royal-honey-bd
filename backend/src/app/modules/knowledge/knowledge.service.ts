import { type KnowledgeCategoryEnum, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import config from '../../../configs';
import ApiError from '../../errors/ApiError';
import { openai } from '../../libs/openai';
import prisma from '../../libs/prisma';
import type {
  ICreateKnowledgePayload,
  IKnowledgeFilterRequest,
  ISearchKnowledgeQuery,
  IUpdateKnowledgePayload,
} from './knowledge.interface';
import type { IPaginationOptions } from '../products/product.interface';

/**
 * Generate embedding vector using OpenAI text-embedding-3-small
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    if (!config.openai.apiKey) {
      return [];
    }

    const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 4096);
    if (!cleanText) return [];

    const response = await openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: cleanText,
    });

    const values = response.data?.[0]?.embedding;
    if (!values || !Array.isArray(values)) {
      return [];
    }

    return values;
  } catch (error: any) {
    console.warn(
      '⚠️ Notice: OpenAI embedding generation skipped/failed:',
      error?.message || error,
    );
    return [];
  }
};

/**
 * Calculate Cosine Similarity between two numeric vectors
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
};

const createKnowledgeItem = async (payload: ICreateKnowledgePayload) => {
  const textForEmbedding = `${payload.question}\n${payload.answer}`;
  const embedding = await generateEmbedding(textForEmbedding);

  const item = await prisma.knowledgeItem.create({
    data: {
      question: payload.question,
      answer: payload.answer,
      category: payload.category || 'FAQ',
      tags: payload.tags || [],
      embedding,
      metadata: payload.metadata ?? Prisma.JsonNull,
      isActive: payload.isActive ?? true,
    },
  });

  return item;
};

const updateKnowledgeItem = async (
  id: string,
  payload: IUpdateKnowledgePayload,
) => {
  const existing = await prisma.knowledgeItem.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Knowledge item not found');
  }

  let embedding = existing.embedding;

  if (payload.question !== undefined || payload.answer !== undefined) {
    const question = payload.question ?? existing.question;
    const answer = payload.answer ?? existing.answer;
    embedding = await generateEmbedding(`${question}\n${answer}`);
  }

  const updated = await prisma.knowledgeItem.update({
    where: { id },
    data: {
      ...payload,
      embedding,
      metadata: payload.metadata !== undefined ? payload.metadata : undefined,
    },
  });

  return updated;
};

const deleteKnowledgeItem = async (id: string) => {
  const existing = await prisma.knowledgeItem.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Knowledge item not found');
  }

  await prisma.knowledgeItem.delete({
    where: { id },
  });

  return { message: 'Knowledge item deleted successfully' };
};

const getKnowledgeItemById = async (id: string) => {
  const item = await prisma.knowledgeItem.findUnique({
    where: { id },
  });

  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Knowledge item not found');
  }

  return item;
};

const getAllKnowledgeItems = async (
  filters: IKnowledgeFilterRequest,
  options: IPaginationOptions,
) => {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 20);
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';

  const { searchTerm, category, isActive } = filters;

  const andConditions: Prisma.KnowledgeItemWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { question: { contains: searchTerm, mode: 'insensitive' } },
        { answer: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { has: searchTerm } },
      ],
    });
  }

  if (category) {
    andConditions.push({
      category: { equals: category as KnowledgeCategoryEnum },
    });
  }

  if (isActive !== undefined) {
    const activeBool = isActive === 'true' || isActive === true;
    andConditions.push({ isActive: activeBool });
  }

  const whereConditions: Prisma.KnowledgeItemWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [data, total] = await Promise.all([
    prisma.knowledgeItem.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        category: true,
        question: true,
        answer: true,
        tags: true,
        isActive: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.knowledgeItem.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

/**
 * Search Knowledge Base for RAG context (Semantic Vector Search + Keyword matching fallback)
 */
const searchKnowledge = async (searchParams: ISearchKnowledgeQuery) => {
  const { query, category, topK = 4, minSimilarity = 0.3 } = searchParams;

  const whereCondition: Prisma.KnowledgeItemWhereInput = {
    isActive: true,
    ...(category ? { category } : {}),
  };

  const allItems = await prisma.knowledgeItem.findMany({
    where: whereCondition,
  });

  if (allItems.length === 0) {
    return [];
  }

  // 1. Try vector semantic similarity
  const queryVec = await generateEmbedding(query);

  if (queryVec.length > 0) {
    const scoredItems = allItems
      .filter((item) => item.embedding && item.embedding.length > 0)
      .map((item) => ({
        item: {
          id: item.id,
          category: item.category,
          question: item.question,
          answer: item.answer,
          tags: item.tags,
          metadata: item.metadata,
        },
        similarity: cosineSimilarity(queryVec, item.embedding),
      }))
      .filter((scored) => scored.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    if (scoredItems.length > 0) {
      return scoredItems;
    }
  }

  // 2. Keyword fallback if embedding not available or yields low results
  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(/\s+/).filter((w) => w.length > 2);

  const scoredFallback = allItems
    .map((item) => {
      const fullText = `${item.question} ${item.answer} ${item.tags.join(' ')}`.toLowerCase();
      let matchCount = 0;
      for (const kw of keywords) {
        if (fullText.includes(kw)) {
          matchCount++;
        }
      }
      const score = keywords.length > 0 ? matchCount / keywords.length : 0;
      return {
        item: {
          id: item.id,
          category: item.category,
          question: item.question,
          answer: item.answer,
          tags: item.tags,
          metadata: item.metadata,
        },
        similarity: score,
      };
    })
    .filter((scored) => scored.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scoredFallback;
};

export const KnowledgeServices = {
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  getKnowledgeItemById,
  getAllKnowledgeItems,
  searchKnowledge,
  generateEmbedding,
  cosineSimilarity,
};
