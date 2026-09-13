import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { ApiResponse, KnowledgeCategory, KnowledgeItem } from "@/types";

export const knowledgeService = {
  async getAllKnowledgeItems(params?: {
    category?: KnowledgeCategory;
    search?: string;
  }): Promise<ApiResponse<KnowledgeItem[]>> {
    let endpoint = API_ENDPOINTS.KNOWLEDGE.LIST;
    const sp = new URLSearchParams();
    if (params?.category) sp.append("category", params.category);
    if (params?.search) sp.append("search", params.search);
    const qs = sp.toString();
    if (qs) endpoint += `?${qs}`;

    return apiClient.get<KnowledgeItem[]>(endpoint);
  },

  async getKnowledgeItemById(id: string): Promise<ApiResponse<KnowledgeItem>> {
    return apiClient.get<KnowledgeItem>(`/knowledge/${id}`);
  },

  async createKnowledgeItem(data: {
    category: KnowledgeCategory;
    question: string;
    answer: string;
    tags?: string[];
  }): Promise<ApiResponse<KnowledgeItem>> {
    return apiClient.post<KnowledgeItem>(API_ENDPOINTS.KNOWLEDGE.CREATE, data);
  },

  async updateKnowledgeItem(
    id: string,
    data: Partial<{
      category: KnowledgeCategory;
      question: string;
      answer: string;
      tags: string[];
      isActive: boolean;
    }>
  ): Promise<ApiResponse<KnowledgeItem>> {
    return apiClient.patch<KnowledgeItem>(API_ENDPOINTS.KNOWLEDGE.UPDATE(id), data);
  },

  async deleteKnowledgeItem(id: string): Promise<ApiResponse<unknown>> {
    return apiClient.delete<unknown>(API_ENDPOINTS.KNOWLEDGE.DELETE(id));
  },

  async testSearch(query: string, topK = 3): Promise<ApiResponse<KnowledgeItem[]>> {
    return apiClient.post<KnowledgeItem[]>(API_ENDPOINTS.KNOWLEDGE.SEARCH, {
      query,
      topK,
    });
  },
};

