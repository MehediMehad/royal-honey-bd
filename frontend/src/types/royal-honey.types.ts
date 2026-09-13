export type OrderStatus =
  | "PENDING"
  | "PAYMENT_VERIFICATION_PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod = "COD" | "BKASH" | "NAGAD";

export type OrderPaymentStatus = "UNPAID" | "VERIFICATION_PENDING" | "PAID" | "FAILED";

export type CustomerChannel = "FACEBOOK" | "WHATSAPP";

export type ConversationStatus = "AI_ACTIVE" | "HUMAN_TAKEOVER" | "CLOSED";

export type SenderType = "CUSTOMER" | "AI_BOT" | "HUMAN_AGENT";

export type KnowledgeCategory = "FAQ" | "POLICY" | "HONEY_GUIDE" | "ANNOUNCEMENT";

export interface Product {
  id: string;
  name: string;
  price: number;
  weight: string;
  description?: string | null;
  stockCount: number;
  minThreshold: number;
  lowStockAlertSent?: boolean;
  isAvailable: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RestockLog {
  id: string;
  productId: string;
  quantityAdded: number;
  previousStock: number;
  newStock: number;
  restockedBy?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  phone?: string | null;
  name?: string | null;
  district?: string | null;
  thana?: string | null;
  fullAddress?: string | null;
  fraudRiskRate?: number | null;
  linkedChannels?: CustomerChannel[];
  cartItemsCount?: number;
  cartTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

export interface Order {
  id: string; // RH-XXXXXX
  customerId: string;
  productTotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  transactionId?: string | null;
  paymentProofUrl?: string | null;
  paymentVerifiedAt?: string | null;
  paymentVerifiedBy?: string | null;
  orderStatus: OrderStatus;
  courierProvider?: string | null;
  consignmentId?: string | null;
  trackingCode?: string | null;
  sourceChannel: CustomerChannel;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface Message {
  id: string;
  conversationId: string;
  sender: SenderType;
  messageType: "TEXT" | "IMAGE" | "AUDIO" | "VIDEO";
  content: string;
  mediaUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  channel?: CustomerChannel;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  channel: CustomerChannel;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  messages?: Message[];
}

export interface KnowledgeItem {
  id: string;
  category: KnowledgeCategory;
  question: string;
  answer: string;
  tags: string[];
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalProducts: number;
  lowStockCount: number;
  activeConversations: number;
  takeoverConversations: number;
}

export interface DashboardStats {
  metrics: DashboardMetrics;
  lowStockProducts: Product[];
  recentOrders: Order[];
}
