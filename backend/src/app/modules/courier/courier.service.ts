import httpStatus from 'http-status';
import { PaymentStatus } from '@prisma/client';
import ApiError from '../../errors/ApiError';
import prisma from '../../libs/prisma';
import { OrderAlerts } from '../order/order.alert';
import type {
  ICourierFraudCheckResult,
  ICourierTrackingResult,
} from './courier.interface';
import { SteadfastServices } from './steadfast.service';

/**
 * Unified Courier Service (Steadfast primary, extensible to Pathao)
 */
const bookOrderParcel = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: true,
    },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, `অর্ডার "${orderId}" পাওয়া যায়নি।`);
  }

  // If already booked, return existing order
  if (order.consignmentId && order.trackingCode) {
    return order;
  }

  const customer = order.customer;
  if (!customer || !customer.phone) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'কুরিয়ার বুকিং করতে গ্রাহকের ফোন নম্বর আবশ্যক।',
    );
  }

  const fullDeliveryAddress = `${customer.fullAddress || ''}, ${customer.thana ? customer.thana + ', ' : ''
    }${customer.district || ''}`.trim();

  // If already paid via bKash/Nagad, COD collection is 0. If COD, collect totalAmount.
  const codAmount =
    order.paymentStatus === PaymentStatus.PAID ? 0 : order.totalAmount;

  // Book in Steadfast (Sandbox or Production)
  const booking = await SteadfastServices.createParcel({
    invoice: order.id,
    recipient_name: customer.name || 'সম্মানিত গ্রাহক',
    recipient_phone: customer.phone,
    recipient_address: fullDeliveryAddress,
    cod_amount: codAmount,
    note: `Royal Honey BD (ID: ${order.id}) — কাঁচের বোতল, সাবধানে হ্যান্ডেল করুন`,
  });

  // Update order with courier details
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      courierProvider: 'STEADFAST',
      consignmentId: booking.consignmentId,
      trackingCode: booking.trackingCode,
    },
    include: {
      customer: true,
      items: true,
    },
  });

  // Secondary Backup: Sync to Google Sheets via n8n outgoing webhook
  OrderAlerts.sendGoogleSheetBackup(updatedOrder, customer).catch((err) =>
    console.error('Error in sendGoogleSheetBackup:', err),
  );

  return updatedOrder;
};

/**
 * Check customer past courier delivery rate / fraud score
 */
const checkCustomerFraud = async (
  phone: string,
): Promise<ICourierFraudCheckResult> => {
  const result = await SteadfastServices.checkCustomerFraud(phone);

  // If customer exists in DB, update fraudRiskRate
  try {
    const cleanPhone = phone.replace(/[\s-+]/g, '');
    await prisma.customer.updateMany({
      where: {
        OR: [{ phone: cleanPhone }, { phone: `+88${cleanPhone}` }],
      },
      data: {
        fraudRiskRate: 100 - result.deliverySuccessRate, // Risk = 100 - SuccessRate
      },
    });
  } catch (err) {
    // Non-blocking
  }

  return result;
};

/**
 * Track parcel by Order ID
 */
const trackOrder = async (orderId: string): Promise<ICourierTrackingResult> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, `অর্ডার "${orderId}" পাওয়া যায়নি।`);
  }

  if (!order.consignmentId && !order.trackingCode) {
    return {
      consignmentId: '',
      status: 'not_booked',
      isSandbox: SteadfastServices.isSandboxMode(),
    };
  }

  const trackingId = order.consignmentId || order.trackingCode!;
  return await SteadfastServices.trackParcel(trackingId);
};

export const CourierServices = {
  bookOrderParcel,
  checkCustomerFraud,
  trackOrder,
};

