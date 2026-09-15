import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { ApiResponse, Conversation, ConversationsApiResponse, Message } from "@/types";

export interface GetConversationsParams {
  channel?: string;
  category?: string;
  status?: string;
  searchTerm?: string;
}

export const chatService = {
  async getConversations(
    params?: GetConversationsParams
  ): Promise<ApiResponse<ConversationsApiResponse | Conversation[]>> {
    const searchParams = new URLSearchParams();
    if (params?.channel && params.channel !== "ALL") searchParams.set("channel", params.channel);
    if (params?.category && params.category !== "ALL") searchParams.set("category", params.category);
    if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
    if (params?.searchTerm) searchParams.set("searchTerm", params.searchTerm);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiClient.get(API_ENDPOINTS.CHAT.CONVERSATIONS + query);
  },

  async getMessages(
    conversationId: string
  ): Promise<
    ApiResponse<{ conversation: Conversation; messages: Message[] } | Message[]>
  > {
    return apiClient.get(API_ENDPOINTS.CHAT.MESSAGES(conversationId));
  },

  async takeover(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(API_ENDPOINTS.CHAT.TAKEOVER(conversationId));
  },

  async resumeAi(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(API_ENDPOINTS.CHAT.RESUME_AI(conversationId));
  },

  async sendReply(
    conversationId: string,
    text: string
  ): Promise<ApiResponse<{ message: string; data: Message }>> {
    return apiClient.post<{ message: string; data: Message }>(
      API_ENDPOINTS.CHAT.REPLY(conversationId),
      { content: text, text }
    );
  },
};

