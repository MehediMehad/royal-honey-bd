import { CustomerChannelEnum, OrderStatus } from '@prisma/client';
import prisma from '../../libs/prisma';
import { chatMessageQueue } from '../../libs/queue';
import { logger } from '../../libs/logger';
import { MessageSender } from '../chat/message.sender';
import type {
  IAnalyticsOverview,
  ITimeseriesDataPoint,
  IProductSalesBreakdown,
  IConversionFunnel,
  IHandoffAnalytics,
  ICourierMetrics,
  IDlqMetrics,
  IDlqJob,
  IAbandonedCart,
  IAbandonedCartOverview,
} from './analytics.interface';

/**
 * Get comprehensive business intelligence analytics overview
 */
const getOverviewAnalytics = async (timeframe: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<IAnalyticsOverview> => {
  const daysMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };

  const days = daysMap[timeframe] || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // 1. Fetch orders in the timeframe
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    include: {
      items: true,
      customer: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // 2. Build Daily Timeseries
  const dateBucketMap = new Map<string, { revenue: number; orderCount: number }>();
  const currentDate = new Date(startDate);
  const today = new Date();

  while (currentDate <= today) {
    const key = currentDate.toISOString().split('T')[0];
    dateBucketMap.set(key, { revenue: 0, orderCount: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  let totalRevenue = 0;
  let confirmedOrdersCount = 0;

  const validOrderStatuses: OrderStatus[] = [
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];

  orders.forEach((order) => {
    const orderDate = order.createdAt.toISOString().split('T')[0];
    const isPaidOrConfirmed = validOrderStatuses.includes(order.orderStatus);

    if (dateBucketMap.has(orderDate)) {
      const current = dateBucketMap.get(orderDate)!;
      if (isPaidOrConfirmed) {
        current.revenue += order.totalAmount;
        current.orderCount += 1;
        totalRevenue += order.totalAmount;
        confirmedOrdersCount += 1;
      }
    }
  });

  const timeseries: ITimeseriesDataPoint[] = Array.from(dateBucketMap.entries()).map(
    ([date, val]) => ({
      date,
      revenue: Math.round(val.revenue * 100) / 100,
      orderCount: val.orderCount,
    }),
  );

  // 3. Best-Selling Products Breakdown
  const productAggMap = new Map<string, { name: string; unitsSold: number; revenue: number }>();

  orders.forEach((order) => {
    if (validOrderStatuses.includes(order.orderStatus)) {
      order.items.forEach((item) => {
        const existing = productAggMap.get(item.productId) || {
          name: item.productName,
          unitsSold: 0,
          revenue: 0,
        };
        existing.unitsSold += item.quantity;
        existing.revenue += item.totalPrice;
        productAggMap.set(item.productId, existing);
      });
    }
  });

  const totalProductRevenue = Array.from(productAggMap.values()).reduce(
    (acc, curr) => acc + curr.revenue,
    0,
  );

  const productBreakdown: IProductSalesBreakdown[] = Array.from(productAggMap.entries())
    .map(([productId, val]) => ({
      productId,
      productName: val.name,
      unitsSold: val.unitsSold,
      revenue: Math.round(val.revenue * 100) / 100,
      percentage:
        totalProductRevenue > 0
          ? Math.round((val.revenue / totalProductRevenue) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 4. AI Chat Conversion Rate Funnel
  const [
    totalConversations,
    uniqueCustomersCount,
    cartsCreatedCount,
    customersWithOrdersCount,
    fbConversationsCount,
    waConversationsCount,
    fbOrdersCount,
    waOrdersCount,
  ] = await Promise.all([
    prisma.conversation.count({ where: { createdAt: { gte: startDate } } }),
    prisma.customer.count({ where: { createdAt: { gte: startDate } } }),
    prisma.cart.count({ where: { createdAt: { gte: startDate }, items: { some: {} } } }),
    prisma.customer.count({
      where: {
        createdAt: { gte: startDate },
        orders: { some: { orderStatus: { in: validOrderStatuses } } },
      },
    }),
    prisma.conversation.count({
      where: {
        createdAt: { gte: startDate },
        channel: CustomerChannelEnum.FACEBOOK,
      },
    }),
    prisma.conversation.count({
      where: {
        createdAt: { gte: startDate },
        channel: CustomerChannelEnum.WHATSAPP,
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startDate },
        sourceChannel: CustomerChannelEnum.FACEBOOK,
        orderStatus: { in: validOrderStatuses },
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startDate },
        sourceChannel: CustomerChannelEnum.WHATSAPP,
        orderStatus: { in: validOrderStatuses },
      },
    }),
  ]);

  const overallConversionRate =
    uniqueCustomersCount > 0
      ? Math.round((customersWithOrdersCount / uniqueCustomersCount) * 1000) / 10
      : 0;

  const fbConversionRate =
    fbConversationsCount > 0
      ? Math.round((fbOrdersCount / fbConversationsCount) * 1000) / 10
      : 0;

  const waConversionRate =
    waConversationsCount > 0
      ? Math.round((waOrdersCount / waConversationsCount) * 1000) / 10
      : 0;

  const conversionFunnel: IConversionFunnel = {
    totalConversations,
    uniqueCustomers: uniqueCustomersCount,
    cartsCreated: cartsCreatedCount,
    ordersConfirmed: customersWithOrdersCount,
    overallConversionRate,
    channelBreakdown: {
      facebook: {
        conversations: fbConversationsCount,
        orders: fbOrdersCount,
        rate: fbConversionRate,
      },
      whatsapp: {
        conversations: waConversationsCount,
        orders: waOrdersCount,
        rate: waConversionRate,
      },
    },
  };

  // 5. Human Handoff Rate & Reasons Analytics
  const [totalHandoffs, openHandoffs, resolvedHandoffs, handoffsList] =
    await Promise.all([
      prisma.humanHandoff.count({ where: { createdAt: { gte: startDate } } }),
      prisma.humanHandoff.count({
        where: { createdAt: { gte: startDate }, status: 'OPEN' },
      }),
      prisma.humanHandoff.count({
        where: { createdAt: { gte: startDate }, status: 'RESOLVED' },
      }),
      prisma.humanHandoff.findMany({
        where: { createdAt: { gte: startDate } },
        select: { reason: true },
      }),
    ]);

  const handoffReasonMap = new Map<string, number>();
  handoffsList.forEach((h) => {
    const rawReason = (h.reason || 'General inquiry / Low confidence').trim();
    handoffReasonMap.set(rawReason, (handoffReasonMap.get(rawReason) || 0) + 1);
  });

  const reasonsBreakdown = Array.from(handoffReasonMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage:
        totalHandoffs > 0
          ? Math.round((count / totalHandoffs) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const handoffRate =
    totalConversations > 0
      ? Math.round((totalHandoffs / totalConversations) * 1000) / 10
      : 0;

  const handoffAnalytics: IHandoffAnalytics = {
    totalHandoffs,
    openHandoffs,
    resolvedHandoffs,
    handoffRate,
    reasonsBreakdown,
  };

  // 6. Courier Delivery Success vs Return Rate
  const [deliveredCount, inTransitCount, returnedCount, totalBooked] =
    await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          orderStatus: OrderStatus.DELIVERED,
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          orderStatus: { in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED] },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          orderStatus: OrderStatus.CANCELLED,
          consignmentId: { not: null },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          consignmentId: { not: null },
        },
      }),
    ]);

  const completedParcels = deliveredCount + returnedCount;
  const successRate =
    completedParcels > 0
      ? Math.round((deliveredCount / completedParcels) * 1000) / 10
      : 100;
  const returnRate =
    completedParcels > 0
      ? Math.round((returnedCount / completedParcels) * 1000) / 10
      : 0;

  const courierMetrics: ICourierMetrics = {
    totalBooked: totalBooked || deliveredCount + inTransitCount + returnedCount,
    delivered: deliveredCount,
    inTransit: inTransitCount,
    returned: returnedCount,
    successRate,
    returnRate,
  };

  const avgOrderValue =
    confirmedOrdersCount > 0
      ? Math.round((totalRevenue / confirmedOrdersCount) * 100) / 100
      : 0;

  return {
    timeseries,
    productBreakdown,
    conversionFunnel,
    handoffAnalytics,
    courierMetrics,
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: confirmedOrdersCount,
      avgOrderValue,
      activeCustomers: uniqueCustomersCount,
    },
  };
};

/**
 * Get BullMQ Dead-Letter Queue (DLQ) and queue metrics
 */
const getDlqMetrics = async (): Promise<IDlqMetrics> => {
  try {
    const counts = await chatMessageQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );

    const failedJobs = await chatMessageQueue.getFailed(0, 50);

    const jobs: IDlqJob[] = failedJobs.map((job) => ({
      id: job.id || 'unknown',
      name: job.name,
      queue: chatMessageQueue.name,
      data: job.data,
      failedReason: job.failedReason || 'Unknown error occurred during job processing',
      stacktrace: job.stacktrace || [],
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
    }));

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      jobs,
      workerStatus: {
        role: process.env.WORKER_ROLE || 'all',
        healthy: true,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    logger.error('Failed to retrieve DLQ metrics from BullMQ', { error: error?.message });
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      jobs: [],
      workerStatus: {
        role: process.env.WORKER_ROLE || 'all',
        healthy: false,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    };
  }
};

/**
 * Retry a specific failed job in DLQ
 */
const retryDlqJob = async (jobId: string): Promise<{ success: boolean; message: string }> => {
  const job = await chatMessageQueue.getJob(jobId);
  if (!job) {
    throw new Error(`Job #${jobId} not found in BullMQ queue`);
  }

  await job.retry();
  logger.info(`Retried BullMQ job #${jobId} successfully`);
  return { success: true, message: `Job #${jobId} re-enqueued for execution` };
};

/**
 * Retry all failed jobs in DLQ
 */
const retryAllDlqJobs = async (): Promise<{ success: boolean; retriedCount: number }> => {
  const failedJobs = await chatMessageQueue.getFailed(0, 100);
  let retriedCount = 0;

  for (const job of failedJobs) {
    try {
      await job.retry();
      retriedCount++;
    } catch (err: any) {
      logger.warn(`Failed to retry DLQ job #${job.id}`, { error: err?.message });
    }
  }

  logger.info(`Bulk retried ${retriedCount} failed jobs in DLQ`);
  return { success: true, retriedCount };
};

/**
 * Purge / clean failed jobs from BullMQ DLQ
 */
const cleanDlqJobs = async (): Promise<{ success: boolean; message: string }> => {
  await chatMessageQueue.clean(0, 0, 'failed');
  logger.info('Cleaned all failed jobs from BullMQ dead-letter queue');
  return { success: true, message: 'DLQ cleaned successfully' };
};

/**
 * Query abandoned carts (idle for > 1 hour with items and no subsequent order)
 */
const getAbandonedCarts = async (): Promise<IAbandonedCartOverview> => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Find carts updated at least 1 hour ago that contain items
  const rawCarts = await prisma.cart.findMany({
    where: {
      updatedAt: { lte: oneHourAgo },
      items: { some: {} },
    },
    include: {
      customer: {
        include: {
          channelUsers: true,
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Filter out carts where customer already placed an order after or near the cart timestamp
  const abandonedList: IAbandonedCart[] = [];
  let recoverableValue = 0;
  let recoveredCount = 0;

  for (const cart of rawCarts) {
    const lastOrder = cart.customer.orders[0];
    const hasActiveOrderAfterCart =
      lastOrder && new Date(lastOrder.createdAt) >= new Date(cart.createdAt);

    if (hasActiveOrderAfterCart) {
      if (cart.abandonedFollowupSentAt) {
        recoveredCount++;
      }
      continue;
    }

    const primaryChannelUser = cart.customer.channelUsers[0];
    const channel = primaryChannelUser?.channel || 'FACEBOOK';
    const channelId = primaryChannelUser?.channelId;

    const cartItems = cart.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const totalValue = cartItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    recoverableValue += totalValue;

    const itemsSummary = cartItems
      .map((item) => `${item.productName} (${item.quantity}টি)`)
      .join(', ');

    abandonedList.push({
      id: cart.id,
      customerId: cart.customerId,
      customerName: cart.customer.name || 'সম্মানিত গ্রাহক',
      customerPhone: cart.customer.phone || 'অনির্ধারিত',
      channel,
      channelId,
      itemsCount: cartItems.length,
      totalValue: Math.round(totalValue),
      items: cartItems,
      itemsSummary,
      updatedAt: cart.updatedAt.toISOString(),
      abandonedFollowupSentAt: cart.abandonedFollowupSentAt
        ? cart.abandonedFollowupSentAt.toISOString()
        : null,
      status: cart.abandonedFollowupSentAt ? 'FOLLOWUP_SENT' : 'PENDING_FOLLOWUP',
    });
  }

  const recoveryRate =
    abandonedList.length + recoveredCount > 0
      ? Math.round((recoveredCount / (abandonedList.length + recoveredCount)) * 1000) / 10
      : 0;

  return {
    totalAbandoned: abandonedList.length,
    recoverableValue: Math.round(recoverableValue),
    recoveredCount,
    recoveryRate,
    carts: abandonedList,
  };
};

/**
 * Trigger personalized re-engagement message to abandoned carts
 */
const triggerAbandonedCartFollowup = async (
  cartId?: string,
): Promise<{ success: boolean; triggeredCount: number; message: string }> => {
  const abandonedData = await getAbandonedCarts();
  const eligibleCarts = cartId
    ? abandonedData.carts.filter((c) => c.id === cartId)
    : abandonedData.carts.filter((c) => !c.abandonedFollowupSentAt);

  let triggeredCount = 0;

  for (const cart of eligibleCarts) {
    if (!cart.channelId) continue;

    const message = `আসসালামু আলাইকুম ${cart.customerName}! 🍯

Royal Honey BD-এর কার্টে আপনার পছন্দের মধু (${cart.itemsSummary}) সংরক্ষিত রয়েছে। প্রাকৃতিক খাঁটি মধুর স্টক সীমিত থাকায় আপনার অর্ডারটি দ্রুত কনফার্ম করে নিতে পারেন।

👉 অর্ডার সম্পন্ন করতে বা কোনো তথ্য জানতে আমাদের এই চ্যাটেই মেসেজ দিন। আপনার সুস্থতাই আমাদের অগ্রাধিকার! ❤️`;

    try {
      await MessageSender.dispatchReply(
        cart.channel as CustomerChannelEnum,
        cart.channelId,
        message,
      );

      await prisma.cart.update({
        where: { id: cart.id },
        data: { abandonedFollowupSentAt: new Date() },
      });

      triggeredCount++;
      logger.info(`Sent abandoned cart follow-up to ${cart.customerName} (${cart.channel}:${cart.channelId})`);
    } catch (err: any) {
      logger.error(`Failed to send abandoned cart follow-up for cart #${cart.id}`, {
        error: err?.message,
      });
    }
  }

  return {
    success: true,
    triggeredCount,
    message: `Triggered abandoned cart follow-up for ${triggeredCount} customer(s)`,
  };
};

/**
 * Automated cron/scheduler for abandoned carts (runs every 30 minutes)
 */
let schedulerInterval: NodeJS.Timeout | null = null;

const initAbandonedCartCron = () => {
  if (schedulerInterval) return;

  // Run initial check after 1 minute, then every 30 minutes
  setTimeout(async () => {
    try {
      logger.info('⏰ Running scheduled abandoned cart re-engagement check...');
      await triggerAbandonedCartFollowup();
    } catch (err: any) {
      logger.error('Abandoned cart scheduled check error', { error: err?.message });
    }
  }, 60 * 1000);

  schedulerInterval = setInterval(async () => {
    try {
      logger.info('⏰ Running periodic abandoned cart re-engagement check...');
      await triggerAbandonedCartFollowup();
    } catch (err: any) {
      logger.error('Abandoned cart periodic check error', { error: err?.message });
    }
  }, 30 * 60 * 1000);

  logger.info('✅ Abandoned cart auto-scheduler initialized (Interval: 30 minutes)');
};

export const AnalyticsServices = {
  getOverviewAnalytics,
  getDlqMetrics,
  retryDlqJob,
  retryAllDlqJobs,
  cleanDlqJobs,
  getAbandonedCarts,
  triggerAbandonedCartFollowup,
  initAbandonedCartCron,
};

