export interface ITimeseriesDataPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface IProductSalesBreakdown {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  percentage: number;
}

export interface IChannelConversion {
  conversations: number;
  orders: number;
  rate: number;
}

export interface IConversionFunnel {
  totalConversations: number;
  uniqueCustomers: number;
  cartsCreated: number;
  ordersConfirmed: number;
  overallConversionRate: number;
  channelBreakdown: {
    facebook: IChannelConversion;
    whatsapp: IChannelConversion;
  };
}

export interface IHandoffReasonBreakdown {
  reason: string;
  count: number;
  percentage: number;
}

export interface IHandoffAnalytics {
  totalHandoffs: number;
  openHandoffs: number;
  resolvedHandoffs: number;
  handoffRate: number;
  reasonsBreakdown: IHandoffReasonBreakdown[];
}

export interface ICourierMetrics {
  totalBooked: number;
  delivered: number;
  inTransit: number;
  returned: number;
  successRate: number;
  returnRate: number;
}

export interface IAnalyticsOverview {
  timeseries: ITimeseriesDataPoint[];
  productBreakdown: IProductSalesBreakdown[];
  conversionFunnel: IConversionFunnel;
  handoffAnalytics: IHandoffAnalytics;
  courierMetrics: ICourierMetrics;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    activeCustomers: number;
  };
}

export interface IDlqJob {
  id: string;
  name: string;
  queue: string;
  data: unknown;
  failedReason: string;
  stacktrace: string[];
  timestamp: number;
  attemptsMade: number;
}

export interface IDlqMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  jobs: IDlqJob[];
  workerStatus: {
    role: string;
    healthy: boolean;
    uptimeSeconds: number;
    timestamp: string;
  };
}

export interface IAbandonedCartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface IAbandonedCart {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  channel: string;
  channelId?: string;
  itemsCount: number;
  totalValue: number;
  items: IAbandonedCartItem[];
  itemsSummary: string;
  updatedAt: string;
  abandonedFollowupSentAt: string | null;
  status: 'PENDING_FOLLOWUP' | 'FOLLOWUP_SENT';
}

export interface IAbandonedCartOverview {
  totalAbandoned: number;
  recoverableValue: number;
  recoveredCount: number;
  recoveryRate: number;
  carts: IAbandonedCart[];
}

