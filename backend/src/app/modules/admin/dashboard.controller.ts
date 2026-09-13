import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { ConversationStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import catchAsync from '../../helpers/catchAsync';
import prisma from '../../libs/prisma';
import sendResponse from '../../utils/sendResponse';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const [
    totalOrders,
    pendingPayments,
    confirmedOrders,
    deliveredOrders,
    totalProducts,
    lowStockProducts,
    activeConversations,
    takeoverConversations,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: { paymentStatus: PaymentStatus.VERIFICATION_PENDING },
    }),
    prisma.order.count({
      where: { orderStatus: OrderStatus.CONFIRMED },
    }),
    prisma.order.count({
      where: { orderStatus: OrderStatus.DELIVERED },
    }),
    prisma.product.count(),
    prisma.product.findMany({
      where: {
        stockCount: {
          lte: 10, // products with stock <= minThreshold
        },
      },
      orderBy: { stockCount: 'asc' },
    }),
    prisma.conversation.count({
      where: { status: ConversationStatus.AI_ACTIVE },
    }),
    prisma.conversation.count({
      where: { status: ConversationStatus.HUMAN_TAKEOVER },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: true,
      },
    }),
  ]);

  // Aggregate total revenue from paid / confirmed orders
  const revenueResult = await prisma.order.aggregate({
    where: {
      orderStatus: { in: [OrderStatus.CONFIRMED, OrderStatus.DELIVERED, OrderStatus.PROCESSING, OrderStatus.SHIPPED] },
    },
    _sum: {
      totalAmount: true,
    },
  });

  const totalRevenue = revenueResult._sum.totalAmount || 0;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: {
      metrics: {
        totalOrders,
        totalRevenue,
        pendingPayments,
        confirmedOrders,
        deliveredOrders,
        totalProducts,
        lowStockCount: lowStockProducts.length,
        activeConversations,
        takeoverConversations,
      },
      lowStockProducts,
      recentOrders,
    },
  });
});

export const DashboardControllers = {
  getDashboardStats,
};
