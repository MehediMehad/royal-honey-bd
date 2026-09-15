import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { ApiResponse, Order, OrderStatus } from "@/types";

export const orderService = {
  async getAllOrders(params?: {
    status?: string;
    paymentStatus?: string;
    search?: string;
  }): Promise<ApiResponse<Order[]>> {
    let endpoint = API_ENDPOINTS.ORDERS.LIST;
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.paymentStatus) searchParams.append("paymentStatus", params.paymentStatus);
    if (params?.search) searchParams.append("search", params.search);

    const qs = searchParams.toString();
    if (qs) endpoint += `?${qs}`;

    return apiClient.get<Order[]>(endpoint);
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return apiClient.get<Order>(API_ENDPOINTS.ORDERS.DETAILS(id));
  },

  async verifyPayment(
    id: string,
    action: "APPROVE" | "REJECT",
    notes?: string
  ): Promise<ApiResponse<Order>> {
    return apiClient.patch<Order>(API_ENDPOINTS.ORDERS.VERIFY_PAYMENT(id), {
      action,
      status: action === "APPROVE" ? "PAID" : "REJECTED",
      notes,
    });
  },

  async updateStatus(id: string, status: OrderStatus): Promise<ApiResponse<Order>> {
    return apiClient.patch<Order>(API_ENDPOINTS.ORDERS.STATUS(id), { status });
  },

  async bookCourier(orderId: string): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>(API_ENDPOINTS.COURIER.BOOK(orderId));
  },

  async checkFraud(phone: string): Promise<
    ApiResponse<{
      phone: string;
      fraudRiskRate: number;
      totalParcels: number;
      successParcels: number;
      cancelledParcels: number;
    }>
  > {
    return apiClient.get(API_ENDPOINTS.COURIER.FRAUD_CHECK(phone));
  },

  getInvoiceUrl(id: string): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    return `${apiUrl}${API_ENDPOINTS.ORDERS.INVOICE(id)}`;
  },
};

