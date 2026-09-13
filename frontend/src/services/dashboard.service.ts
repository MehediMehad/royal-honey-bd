import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { ApiResponse, DashboardStats } from "@/types";

export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>(API_ENDPOINTS.ADMIN.STATS);
  },
};

