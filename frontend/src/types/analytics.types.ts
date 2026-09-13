export interface TimeseriesDataPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface ProductSalesBreakdown {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  percentage: number;
}

export interface ChannelConversion {
  conversations: number;
  orders: number;
  rate: number;
}

export interface ConversionFunnel {
  totalConversations: number;
  uniqueCustomers: number;
  cartsCreated: number;
  ordersConfirmed: number;
  overallConversionRate: number;
  channelBreakdown: {
    facebook: ChannelConversion;
    whatsapp: ChannelConversion;
  };
}

export interface HandoffReasonBreakdown {
  reason: string;
  count: number;
  percentage: number;
}

export interface HandoffAnalytics {
  totalHandoffs: number;
  openHandoffs: number;
  resolvedHandoffs: number;
  handoffRate: number;
  reasonsBreakdown: HandoffReasonBreakdown[];
}

export interface CourierMetrics {
  totalBooked: number;
  delivered: number;
  inTransit: number;
  returned: number;
  successRate: number;
  returnRate: number;
}

export interface AnalyticsOverview {
  timeseries: TimeseriesDataPoint[];
  productBreakdown: ProductSalesBreakdown[];
  conversionFunnel: ConversionFunnel;
  handoffAnalytics: HandoffAnalytics;
  courierMetrics: CourierMetrics;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    activeCustomers: number;
  };
}

export interface DlqJob {
  id: string;
  name: string;
  queue: string;
  data: unknown;
  failedReason: string;
  stacktrace: string[];
  timestamp: number;
  attemptsMade: number;
}

export interface DlqMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  jobs: DlqJob[];
  workerStatus: {
    role: string;
    healthy: boolean;
    uptimeSeconds: number;
    timestamp: string;
  };
}

export interface AbandonedCartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface AbandonedCart {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  channel: string;
  channelId?: string;
  itemsCount: number;
  totalValue: number;
  items: AbandonedCartItem[];
  itemsSummary: string;
  updatedAt: string;
  abandonedFollowupSentAt: string | null;
  status: 'PENDING_FOLLOWUP' | 'FOLLOWUP_SENT';
}

export interface AbandonedCartOverview {
  totalAbandoned: number;
  recoverableValue: number;
  recoveredCount: number;
  recoveryRate: number;
  carts: AbandonedCart[];
}

