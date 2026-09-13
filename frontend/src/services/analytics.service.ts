import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  ApiResponse,
  AnalyticsOverview,
  DlqMetrics,
  AbandonedCartOverview,
} from "@/types";

export const analyticsService = {
  async getOverview(timeframe = "30d"): Promise<ApiResponse<AnalyticsOverview>> {
    return apiClient.get<AnalyticsOverview>(
      API_ENDPOINTS.ANALYTICS.OVERVIEW(timeframe)
    );
  },

  async getDlqMetrics(): Promise<ApiResponse<DlqMetrics>> {
    return apiClient.get<DlqMetrics>(API_ENDPOINTS.ANALYTICS.DLQ);
  },

  async retryDlqJob(
    jobId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.ANALYTICS.DLQ_RETRY(jobId),
      {}
    );
  },

  async retryAllDlq(): Promise<
    ApiResponse<{ success: boolean; retriedCount: number }>
  > {
    return apiClient.post<{ success: boolean; retriedCount: number }>(
      API_ENDPOINTS.ANALYTICS.DLQ_RETRY_ALL,
      {}
    );
  },

  async cleanDlq(): Promise<
    ApiResponse<{ success: boolean; message: string }>
  > {
    return apiClient.delete<{ success: boolean; message: string }>(
      API_ENDPOINTS.ANALYTICS.DLQ_CLEAN
    );
  },

  async getAbandonedCarts(): Promise<ApiResponse<AbandonedCartOverview>> {
    return apiClient.get<AbandonedCartOverview>(
      API_ENDPOINTS.ANALYTICS.ABANDONED_CARTS
    );
  },

  async triggerFollowup(
    cartId?: string
  ): Promise<
    ApiResponse<{ success: boolean; triggeredCount: number; message: string }>
  > {
    return apiClient.post<{
      success: boolean;
      triggeredCount: number;
      message: string;
    }>(API_ENDPOINTS.ANALYTICS.ABANDONED_TRIGGER, { cartId });
  },
};

