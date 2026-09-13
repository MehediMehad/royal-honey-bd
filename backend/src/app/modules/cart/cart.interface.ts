import type { ICartSessionItem } from '../customer/customer.session';

export interface ICartItemInput {
  productId: string;
  quantity: number;
}

export interface ICartModificationResult {
  success: boolean;
  message: string;
  cart: {
    cartId: string | null;
    items: ICartSessionItem[];
    productTotal: number;
    deliveryCharge: number;
    finalTotal: number;
  };
  stockWarning?: string;
}

