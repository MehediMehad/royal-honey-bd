import type { KnowledgeCategoryEnum } from '@prisma/client';

export interface IKnowledgeFilterRequest {
  searchTerm?: string;
  category?: KnowledgeCategoryEnum;
  isActive?: boolean | string;
}

export interface ICreateKnowledgePayload {
  question: string;
  answer: string;
  category?: KnowledgeCategoryEnum;
  tags?: string[];
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface IUpdateKnowledgePayload {
  question?: string;
  answer?: string;
  category?: KnowledgeCategoryEnum;
  tags?: string[];
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface ISearchKnowledgeQuery {
  query: string;
  category?: KnowledgeCategoryEnum;
  topK?: number;
  minSimilarity?: number;
}
