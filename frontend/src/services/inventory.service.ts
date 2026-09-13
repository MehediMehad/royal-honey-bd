import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { ApiResponse, Product } from "@/types";

export const inventoryService = {
  async getAllProducts(): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS.LIST);
  },

  async getLowStockProducts(): Promise<ApiResponse<Product[]>> {
    return apiClient.get<Product[]>(API_ENDPOINTS.PRODUCTS.LOW_STOCK);
  },

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  async createProduct(data: {
    id: string;
    name: string;
    price: number;
    weight: string;
    description?: string;
    stockCount?: number;
    minThreshold?: number;
    imageUrl?: string;
  }): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>(API_ENDPOINTS.PRODUCTS.CREATE, data);
  },

  async updateProduct(
    id: string,
    data: Partial<{
      name: string;
      price: number;
      weight: string;
      description: string;
      stockCount: number;
      minThreshold: number;
      isAvailable: boolean;
      imageUrl: string;
    }>
  ): Promise<ApiResponse<Product>> {
    return apiClient.patch<Product>(API_ENDPOINTS.PRODUCTS.UPDATE(id), data);
  },

  async restockProduct(
    id: string,
    quantity: number,
    note?: string
  ): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>(API_ENDPOINTS.PRODUCTS.RESTOCK(id), {
      quantity,
      note,
    });
  },

  async deleteProduct(id: string): Promise<ApiResponse<unknown>> {
    return apiClient.delete<unknown>(`/products/${id}`);
  },
};

