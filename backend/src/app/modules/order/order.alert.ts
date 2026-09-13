import axios from 'axios';
import config from '../../../configs';
import type { ILowStockAlertItem } from './order.interface';

/**
 * Dispatch outgoing alerts to Business Owner via Console, Socket (future), & n8n Webhook (WhatsApp / Sheet)
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
গ্রাহক: ${customer.name} (${customer.phone})
পেমেন্ট মেথড: ${order.paymentMethod}
মোট প্রদেয়: ৳${order.totalAmount}
কাস্টমার TrxID: ${order.transactionId || 'স্ক্রিনশট প্রদান করা হয়েছে'}
যাচাই ও কনফার্ম লিংক: ${verifyUrl}
==================================================================
`);

    if (config.meta.n8nWebhookUrl) {
      try {
        await axios.post(
          config.meta.n8nWebhookUrl,
          {
            event: 'ADVANCE_PAYMENT_PENDING',
            orderId: order.id,
            customerName: customer.name,
            customerPhone: customer.phone,
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
    console.log(`
🛒 ==================== NEW ORDER CONFIRMED ==================== 🛒
অর্ডার আইডি: ${order.id}
গ্রাহক: ${customer.name} (${customer.phone})
ডেলিভারি ঠিকানা: ${customer.fullAddress}, ${customer.district}
মোট প্রদেয়: ৳${order.totalAmount} (${order.paymentMethod})
আইটেম সংখ্যা: ${order.items?.length || 0}
ড্যাশবোর্ড ভিউ: ${config.urls.frontend_url}/orders/${order.id}
================================================================
`);

    if (config.meta.n8nWebhookUrl) {
      try {
        await axios.post(
          config.meta.n8nWebhookUrl,
          {
            event: 'ORDER_CONFIRMED',
            orderId: order.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            deliveryAddress: `${customer.fullAddress}, ${customer.district}`,
            items: order.items,
            productTotal: order.productTotal,
            deliveryCharge: order.deliveryCharge,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            timestamp: new Date().toISOString(),
          },
          { timeout: 5000 },
        );
      } catch (err: any) {
        console.warn('⚠️ [OrderAlerts] Failed to send Order Confirmed webhook to n8n:', err?.message || err);
      }
    }
  },
};

