import type { OrderStatus, PaymentMethod, PaymentStatus, CustomerChannelEnum } from '@prisma/client';

export interface IOrderItemCreate {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ICreateOrderPayload {
  customerId: string;
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
  paymentProofUrl?: string | null;
  sourceChannel?: CustomerChannelEnum;
  notes?: string | null;
}

export interface IVerifyPaymentPayload {
  status?: 'PAID' | 'REJECTED' | 'APPROVE' | 'REJECT';
  action?: 'APPROVE' | 'REJECT' | 'PAID' | 'REJECTED';
  transactionId?: string;
  note?: string;
  notes?: string;
  adminNotes?: string;
}

export interface IOrderFilterQuery {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ILowStockAlertItem {
  productId: string;
  productName: string;
  remainingStock: number;
  minThreshold: number;
}

