import { OrderStatus, PaymentMethod, PaymentStatus, CustomerChannelEnum, type Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../libs/prisma';
import { CustomerSession } from '../customer/customer.session';
import { OrderAlerts } from './order.alert';
import type {
  ICreateOrderPayload,
  ILowStockAlertItem,
  IOrderFilterQuery,
  IVerifyPaymentPayload,
} from './order.interface';
import { withOrderLock } from '../../libs/idempotency';
import { bangladeshPhoneRegex } from './order.validation';

/**
 * Generate a unique Order ID in the format RH-XXXXXX (e.g. RH-104928)
 */
const generateUniqueOrderId = async (
  tx: Prisma.TransactionClient,
): Promise<string> => {
  let isUnique = false;
  let orderId = '';

  while (!isUnique) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    orderId = `RH-${randomDigits}`;
    const existing = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!existing) {
      isUnique = true;
    }
  }

  return orderId;
};

/**
 * Atomic Order Creation inside Prisma Transaction
 * Guarantees zero race conditions, safe stock decrement, active cart clearance, and low-stock alerting.
 */
const createAtomicOrder = async (payload: ICreateOrderPayload) => {
  return withOrderLock(payload.customerId, async () => {
    const {
      customerId,
      paymentMethod,
      transactionId,
      paymentProofUrl,
      sourceChannel,
      notes,
    } = payload;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Customer and validate shipping information
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        include: {
          carts: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            include: {
              items: {
                include: { product: true },
              },
            },
          },
        },
      });

      if (!customer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'কাস্টমার প্রোফাইল পাওয়া যায়নি।');
      }

      // Validate phone number
      const cleanPhone = customer.phone ? customer.phone.replace(/[\s-+]/g, '') : '';
      if (!cleanPhone || !bangladeshPhoneRegex.test(cleanPhone)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'অর্ডার সম্পন্ন করতে গ্রাহকের সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রয়োজন।',
        );
      }

      if (!customer.fullAddress || customer.fullAddress.trim().length < 5) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'অর্ডার সম্পন্ন করতে গ্রাহকের পূর্ণ ডেলিভারি ঠিকানা প্রয়োজন।',
        );
      }

      if (!customer.district || customer.district.trim().length < 2) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'অর্ডার সম্পন্ন করতে গ্রাহকের জেলা উল্লেখ করা আবশ্যক।',
        );
      }

      // 2. Fetch Active Cart and validate items
      const activeCart = customer.carts?.[0];
      const cartItems = activeCart?.items || [];

      if (cartItems.length === 0) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'আপনার কার্ট খালি। অর্ডার করতে অন্তত একটি প্রোডাক্ট কার্টে যোগ করুন।',
        );
      }

      // 3. Verify stock availability for each item
      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.isAvailable) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `"${item.product.name}" পণ্যটি বর্তমানে স্টক আউট বা অনুপলব্ধ।`,
          );
        }

        if (product.stockCount < item.quantity) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `"${product.name}" এর পর্যাপ্ত স্টক নেই (বর্তমান স্টক: ${product.stockCount} টি, চাওয়া হয়েছে: ${item.quantity} টি)।`,
          );
        }
      }

      // 4. Calculate pricing & delivery charge
      const productTotal = cartItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
      const isDhaka = customer.district.toLowerCase().includes('dhaka') || customer.district.includes('ঢাকা');
      const deliveryCharge = isDhaka ? 60 : 120;
      const totalAmount = productTotal + deliveryCharge;

      // 5. Generate Unique Order ID
      const orderId = await generateUniqueOrderId(tx);

      // 6. Set Order & Payment Status
      const isCod = paymentMethod === PaymentMethod.COD;
      const orderStatus = isCod
        ? OrderStatus.CONFIRMED
        : OrderStatus.PAYMENT_VERIFICATION_PENDING;
      const paymentStatus = isCod
        ? PaymentStatus.UNPAID
        : PaymentStatus.VERIFICATION_PENDING;

      // 7. Create Order & OrderItems
      const order = await tx.order.create({
        data: {
          id: orderId,
          customerId: customer.id,
          productTotal,
          deliveryCharge,
          totalAmount,
          paymentMethod,
          paymentStatus,
          orderStatus,
          transactionId: transactionId || null,
          paymentProofUrl: paymentProofUrl || null,
          sourceChannel: (sourceChannel || CustomerChannelEnum.FACEBOOK) as CustomerChannelEnum,
          notes: notes || null,
          items: {
            create: cartItems.map((ci) => ({
              productId: ci.productId,
              productName: ci.product.name,
              quantity: ci.quantity,
              unitPrice: ci.unitPrice,
              totalPrice: ci.quantity * ci.unitPrice,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 8. Atomically decrement stock & check low stock threshold
      const lowStockAlerts: ILowStockAlertItem[] = [];
      for (const item of cartItems) {
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stockCount: { decrement: item.quantity },
          },
        });

        if (
          updatedProduct.stockCount <= updatedProduct.minThreshold &&
          !updatedProduct.lowStockAlertSent
        ) {
          await tx.product.update({
            where: { id: item.productId },
            data: { lowStockAlertSent: true },
          });

          lowStockAlerts.push({
            productId: updatedProduct.id,
            productName: updatedProduct.name,
            remainingStock: updatedProduct.stockCount,
            minThreshold: updatedProduct.minThreshold,
          });
        }
      }

      // 9. Clear Cart Items in Database
      await tx.cartItem.deleteMany({
        where: { cartId: activeCart.id },
      });

      return { order, customer, lowStockAlerts };
    });

    // Post-Transaction actions:
    // Invalidate Redis customer session cart
    await CustomerSession.clearSessionCart(customerId);

    // Trigger Low-Stock Alert if threshold reached
    if (result.lowStockAlerts.length > 0) {
      OrderAlerts.sendLowStockAlert(result.lowStockAlerts).catch((err) =>
        console.error('Error in sendLowStockAlert:', err),
      );
    }

    // Trigger Order Confirmed / Verification Alert
    if (result.order.orderStatus === OrderStatus.CONFIRMED) {
      OrderAlerts.sendOrderConfirmedAlert(result.order, result.customer).catch((err) =>
        console.error('Error in sendOrderConfirmedAlert:', err),
      );
    } else if (result.order.orderStatus === OrderStatus.PAYMENT_VERIFICATION_PENDING) {
      OrderAlerts.sendAdvancePaymentAlert(result.order, result.customer).catch((err) =>
        console.error('Error in sendAdvancePaymentAlert:', err),
      );
    }

    return result.order;
  });
};

/**
 * 1-Click Advance Payment Verification by Admin / Owner
 */
const verifyAdvancePayment = async (
  orderId: string,
  adminUserId?: string,
  payload?: IVerifyPaymentPayload,
) => {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: true },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, `অর্ডার "${orderId}" পাওয়া যায়নি।`);
  }

  if (existing.paymentStatus === PaymentStatus.PAID) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'এই অর্ডারের পেমেন্ট ইতোমধ্যে ভেরিফাই ও পরিশোধিত হয়েছে।',
    );
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      paymentVerifiedAt: new Date(),
      paymentVerifiedBy: adminUserId || 'ADMIN',
      transactionId: payload?.transactionId || existing.transactionId,
      notes: payload?.note
        ? existing.notes
          ? `${existing.notes} | ${payload.note}`
          : payload.note
        : existing.notes,
    },
    include: {
      customer: true,
      items: true,
    },
  });

  // Trigger confirmed alert
  OrderAlerts.sendOrderConfirmedAlert(updatedOrder, updatedOrder.customer).catch((err) =>
    console.error('Error in sendOrderConfirmedAlert:', err),
  );

  // Auto-book courier parcel
  try {
    const { CourierServices } = await import('../courier/courier.service');
    return await CourierServices.bookOrderParcel(orderId);
  } catch (err) {
    console.warn('⚠️ Auto courier booking failed on payment verification:', err);
    return updatedOrder;
  }
};

/**
 * Update general order status
 */
const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  notes?: string,
) => {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, `অর্ডার "${orderId}" পাওয়া যায়নি।`);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: status,
      notes: notes ? (existing.notes ? `${existing.notes} | ${notes}` : notes) : existing.notes,
    },
    include: {
      customer: true,
      items: true,
    },
  });

  try {
    const { emitSocketEvent } = await import('../../libs/socket');
    emitSocketEvent('order:status_updated', {
      orderId: updated.id,
      status: updated.orderStatus,
    });
  } catch (socketErr) {
    console.warn('⚠️ [Socket.io] Failed to emit order:status_updated:', socketErr);
  }

  return updated;
};

/**
 * Get all orders with filtering and pagination
 */
const getAllOrders = async (filters: IOrderFilterQuery) => {
  const {
    orderStatus,
    paymentStatus,
    paymentMethod,
    searchTerm,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: Prisma.OrderWhereInput = {};

  if (orderStatus) where.orderStatus = orderStatus;
  const actualStatus = filters.orderStatus || (filters as any).status;
  const actualSearch = filters.searchTerm || (filters as any).search;

  if (actualStatus) {
    if (
      actualStatus === 'VERIFICATION_PENDING' ||
      actualStatus === 'PAYMENT_VERIFICATION_PENDING'
    ) {
      where.orderStatus = OrderStatus.PAYMENT_VERIFICATION_PENDING;
    } else {
      where.orderStatus = actualStatus as OrderStatus;
    }
  }

  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  const searchValue = searchTerm || actualSearch;

  if (searchValue) {
    where.OR = [
      { id: { contains: searchValue, mode: 'insensitive' } },
      { transactionId: { contains: searchValue, mode: 'insensitive' } },
      { customer: { name: { contains: searchValue, mode: 'insensitive' } } },
      { customer: { phone: { contains: searchValue, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: true,
        items: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    data: orders,
  };
};

/**
 * Get single order by ID
 */
const getOrderById = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, `অর্ডার "${orderId}" পাওয়া যায়নি।`);
  }

  return order;
};

export const OrderServices = {
  generateUniqueOrderId,
  createAtomicOrder,
  verifyAdvancePayment,
  updateOrderStatus,
  getAllOrders,
  getOrderById,
};
