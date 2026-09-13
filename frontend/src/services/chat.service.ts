import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { ApiResponse, Conversation, Message } from "@/types";

export const chatService = {
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return apiClient.get<Conversation[]>(API_ENDPOINTS.CHAT.CONVERSATIONS);
  },

  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    return apiClient.get<Message[]>(API_ENDPOINTS.CHAT.MESSAGES(conversationId));
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
      { text }
    );
  },
};

