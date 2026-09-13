import axios from 'axios';
import config from '../../../configs';
import type { ILowStockAlertItem } from './order.interface';

/**
 * Dispatch outgoing alerts to Business Owner via Console, Socket.io, & n8n Webhook (WhatsApp / Sheet)
 */
export const OrderAlerts = {
  /**
   * Alert when a product's stock reaches or drops below its minThreshold
   */
  async sendLowStockAlert(alerts: ILowStockAlertItem[]): Promise<void> {
    if (!alerts || alerts.length === 0) return;

    for (const item of alerts) {
      console.warn(`
🚨 ==================== LOW STOCK ALERT ==================== 🚨
প্রোডাক্ট: ${item.productName} (ID: ${item.productId})
বর্তমান স্টক: ${item.remainingStock} টি
মিনিমাম থ্রেশহোল্ড: ${item.minThreshold} টি
অবস্থা: ক্রিটিক্যাল লো স্টক! দ্রুত রিস্টক করুন।
ড্যাশবোর্ড লিংক: ${config.urls.frontend_url}/admin/inventory
============================================================
`);
    }

    // Emit real-time socket alert to admin dashboard
    try {
      const { emitSocketEvent } = await import('../../libs/socket');
      for (const item of alerts) {
        emitSocketEvent('inventory:low_stock', {
          productId: item.productId,
          productName: item.productName,
          remainingStock: item.remainingStock,
          minThreshold: item.minThreshold,
        });
      }
    } catch (socketErr) {
      console.warn('⚠️ [Socket.io] Failed to emit low stock alert:', socketErr);
    }

    // Outgoing webhook to n8n for WhatsApp alert to business owner
    if (config.meta.n8nWebhookUrl) {
      try {
        await axios.post(
          config.meta.n8nWebhookUrl,
          {
            event: 'LOW_STOCK_ALERT',
            alerts,
            timestamp: new Date().toISOString(),
          },
          { timeout: 5000 },
        );
      } catch (err: any) {
        console.warn('⚠️ [OrderAlerts] Failed to send Low-Stock webhook to n8n:', err?.message || err);
      }
    }
  },

  /**
   * Alert when an advance payment (bKash/Nagad) TrxID is received and awaiting owner verification
   */
  async sendAdvancePaymentAlert(order: any, customer: any): Promise<void> {
    const verifyUrl = `${config.urls.frontend_url}/orders/${order.id}/verify`;

    console.log(`
⚠️ ============= ADVANCE PAYMENT VERIFICATION NEEDED ============= ⚠️
অর্ডার আইডি: ${order.id}
গ্রাহক: ${customer?.name} (${customer?.phone})
পেমেন্ট মেথড: ${order.paymentMethod}
মোট প্রদেয়: ৳${order.totalAmount}
কাস্টমার TrxID: ${order.transactionId || 'স্ক্রিনশট প্রদান করা হয়েছে'}
যাচাই ও কনফার্ম লিংক: ${verifyUrl}
==================================================================
`);

    // Emit real-time socket alert to admin dashboard
    try {
      const { emitSocketEvent } = await import('../../libs/socket');
      emitSocketEvent('payment:pending', {
        orderId: order.id,
        trxId: order.transactionId,
        customerName: customer?.name || 'Customer',
        totalAmount: order.totalAmount,
      });
    } catch (socketErr) {
      console.warn('⚠️ [Socket.io] Failed to emit advance payment alert:', socketErr);
    }

    if (config.meta.n8nWebhookUrl) {
      try {
        await axios.post(
          config.meta.n8nWebhookUrl,
          {
            event: 'ADVANCE_PAYMENT_PENDING',
            orderId: order.id,
            customerName: customer?.name,
            customerPhone: customer?.phone,
            paymentMethod: order.paymentMethod,
            totalAmount: order.totalAmount,
            transactionId: order.transactionId,
            paymentProofUrl: order.paymentProofUrl,
            verifyUrl,
            timestamp: new Date().toISOString(),
          },
          { timeout: 5000 },
        );
      } catch (err: any) {
        console.warn('⚠️ [OrderAlerts] Failed to send Advance Payment webhook to n8n:', err?.message || err);
      }
    }
  },

  /**
   * Alert when an order is confirmed (COD or verified advance payment)
   */
  async sendOrderConfirmedAlert(order: any, customer: any): Promise<void> {
    const courierInfo = order.trackingCode
      ? `কুরিয়ার ট্র্যাকিং: ${order.trackingCode} (${order.courierProvider || 'Steadfast'})\n트্যাকিং লিংক: https://steadfast.com.bd/t/${order.trackingCode}`
      : 'কুরিয়ার বুকিং: প্রক্রিয়াধীন (Pending Booking)';

    console.log(`
🛒 ==================== NEW ORDER CONFIRMED ==================== 🛒
অর্ডার আইডি: ${order.id}
গ্রাহক: ${customer?.name} (${customer?.phone})
ডেলিভারি ঠিকানা: ${customer?.fullAddress}, ${customer?.district}
মোট প্রদেয়: ৳${order.totalAmount} (${order.paymentMethod})
${courierInfo}
আইটেম সংখ্যা: ${order.items?.length || 0}
ড্যাশবোর্ড ভিউ: ${config.urls.frontend_url}/orders/${order.id}
================================================================
`);

    // Emit real-time socket alert to admin dashboard
    try {
      const { emitSocketEvent } = await import('../../libs/socket');
      emitSocketEvent('order:new', {
        orderId: order.id,
        totalAmount: order.totalAmount,
        customerName: customer?.name || 'Customer',
        paymentMethod: order.paymentMethod,
      });
    } catch (socketErr) {
      console.warn('⚠️ [Socket.io] Failed to emit new order alert:', socketErr);
    }

    if (config.meta.n8nWebhookUrl) {
      try {
        await axios.post(
          config.meta.n8nWebhookUrl,
          {
            event: 'ORDER_CONFIRMED',
            orderId: order.id,
            customerName: customer?.name,
            customerPhone: customer?.phone,
            deliveryAddress: `${customer?.fullAddress}, ${customer?.district}`,
            items: order.items,
            productTotal: order.productTotal,
            deliveryCharge: order.deliveryCharge,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            courierProvider: order.courierProvider,
            consignmentId: order.consignmentId,
            trackingCode: order.trackingCode,
            trackingUrl: order.trackingCode
              ? `https://steadfast.com.bd/t/${order.trackingCode}`
              : null,
            timestamp: new Date().toISOString(),
          },
          { timeout: 5000 },
        );
      } catch (err: any) {
        console.warn('⚠️ [OrderAlerts] Failed to send Order Confirmed webhook to n8n:', err?.message || err);
      }
    }
  },

  /**
   * Sync confirmed order data to Google Sheets via n8n webhook (Section 19 Backup)
   */
  async sendGoogleSheetBackup(order: any, customer: any): Promise<void> {
    const productSummary = (order.items || [])
      .map((it: any) => `${it.productName || it.product?.name} (${it.quantity}টি)`)
      .join(', ');

    const sheetRow = {
      orderId: order.id,
      consignmentId: order.consignmentId || 'Pending',
      trackingCode: order.trackingCode || 'Pending',
      dateTime: new Date(order.createdAt || Date.now()).toISOString(),
      customerName: customer?.name || 'N/A',
      phoneNumber: customer?.phone || 'N/A',
      district: customer?.district || 'N/A',
      thana: customer?.thana || 'N/A',
      deliveryAddress: customer?.fullAddress || 'N/A',
      orderedProducts: productSummary,
      productTotal: order.productTotal,
      deliveryCharge: order.deliveryCharge,
      totalPayable: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId || 'N/A',
      courierStatus: order.consignmentId ? 'Booked' : 'Pending',
      orderStatus: order.orderStatus,
      sourceChannel: order.sourceChannel,
      customerId: customer?.id,
    };

    console.log(`📊 [Google Sheet Backup] Queuing row for Order ${order.id}...`);

    if (config.meta.n8nWebhookUrl) {
      try {
        await axios.post(
          config.meta.n8nWebhookUrl,
          {
            event: 'GOOGLE_SHEET_BACKUP',
            row: sheetRow,
            timestamp: new Date().toISOString(),
          },
          { timeout: 5000 },
        );
        console.log(`✅ [Google Sheet Backup] Order ${order.id} synced via n8n.`);
      } catch (err: any) {
        console.warn('⚠️ [OrderAlerts] Failed to sync Google Sheet webhook to n8n:', err?.message || err);
      }
    }
  },
};
