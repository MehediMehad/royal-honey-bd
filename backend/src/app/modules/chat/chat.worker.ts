import { Worker, type Job } from 'bullmq';
import { ConversationStatus, PaymentMethod } from '@prisma/client';
import { CHAT_QUEUE_NAME, redisConnection } from '../../libs/queue';
import { CartServices } from '../cart/cart.service';
import { extractCustomerAndCartEntities } from '../customer/customer.extractor';
import { CustomerServices } from '../customer/customer.service';
import { CustomerSession } from '../customer/customer.session';
import { OrderServices } from '../order/order.service';
import { AiAgent } from './ai.agent';
import type { IProcessMessageJob } from './chat.interface';
import { ChatServices } from './chat.service';
import { MessageSender } from './message.sender';

export const setupChatWorker = () => {
  const worker = new Worker(
    CHAT_QUEUE_NAME,
    async (job: Job<IProcessMessageJob>) => {
      const { channel, channelId, content, mediaUrl } = job.data;
      console.log(`📥 [ChatWorker] Processing message from ${channel}:${channelId}`);

      // 1. Identify/Create Customer and Conversation
      const { customer, conversation } =
        await ChatServices.getOrCreateCustomerAndConversation(job.data);

      // 2. Save incoming customer message
      await ChatServices.saveCustomerMessage(conversation.id, content, mediaUrl);

      // 3. Check if human agent has taken over
      if (conversation.status === ConversationStatus.HUMAN_TAKEOVER) {
        console.log(
          `⏸️ [ChatWorker] Conversation ${conversation.id} is in HUMAN_TAKEOVER mode. Skipping AI reply.`,
        );
        return {
          status: 'skipped',
          reason: 'HUMAN_TAKEOVER',
          conversationId: conversation.id,
        };
      }

      // 4. Hydrate Customer Session (Redis Cache + PostgreSQL fallback)
      let session = await CustomerSession.getSession(customer.id);

      // 5. Extract Customer Details, Cart Actions, Payment Method & Confirmation Intent via OpenAI
      const extracted = await extractCustomerAndCartEntities(content);

      // 6. Apply Customer Profile Updates (Name, Phone, Address, District)
      if (extracted.customerInfo && Object.keys(extracted.customerInfo).length > 0) {
        session = await CustomerServices.updateCustomerProfile(
          customer.id,
          extracted.customerInfo,
        );
      }

      // 7. Apply Cart Modifications (Real-time Stock Validation)
      if (extracted.cartActions && extracted.cartActions.length > 0) {
        for (const cartAction of extracted.cartActions) {
          const qty = cartAction.quantity || 1;
          if (cartAction.action === 'ADD') {
            await CartServices.addItemToCart(
              customer.id,
              cartAction.productKeyword,
              qty,
              session.district,
            );
          } else if (cartAction.action === 'UPDATE') {
            await CartServices.updateItemQuantity(
              customer.id,
              cartAction.productKeyword,
              qty,
              session.district,
            );
          } else if (cartAction.action === 'REMOVE') {
            await CartServices.removeItemFromCart(
              customer.id,
              cartAction.productKeyword,
              session.district,
            );
          } else if (cartAction.action === 'CLEAR') {
            await CartServices.clearCart(customer.id);
          }
        }
        // Refresh session after cart changes
        session = await CustomerSession.getSession(customer.id);
      }

      let aiReply = '';

      // 8. Phase 4: Atomic Order Placement Workflow
      const hasAllDetails = session.missingFields.length === 0 && session.cart.items.length > 0;

      // Case 8.1: Customer submits Advance Payment Transaction ID (TrxID)
      if (hasAllDetails && extracted.transactionId) {
        try {
          const method =
            extracted.paymentMethod === 'NAGAD' ? PaymentMethod.NAGAD : PaymentMethod.BKASH;
          const order = await OrderServices.createAtomicOrder({
            customerId: customer.id,
            paymentMethod: method,
            transactionId: extracted.transactionId,
            paymentProofUrl: mediaUrl || undefined,
            sourceChannel: conversation.channel,
          });

          aiReply = `আপনার পেমেন্টের তথ্য (TrxID: ${extracted.transactionId}) আমরা পেয়েছি।\n\nআমাদের অ্যাকাউন্টস টিম পেমেন্টটি ভেরিফাই করার সাথে সাথেই আপনার অর্ডারটি কনফার্ম করে জানিয়ে দেওয়া হবে। সাধারণত ৫-১০ মিনিট সময় লাগতে পারে।\n\n📦 অর্ডার আইডি: ${order.id}\n💰 মোট প্রদেয়: ৳${order.totalAmount}\n📍 ডেলিভারি ঠিকানা: ${customer.fullAddress}, ${customer.district}\n\nধৈর্য ধরার জন্য ধন্যবাদ ❤️`;
        } catch (err: any) {
          console.error('❌ Order placement failed with TrxID:', err?.message || err);
          aiReply = `দুঃখিত! ${err?.message || 'অর্ডার সম্পন্ন করা সম্ভব হয়নি।'} অনুগ্রহ করে আমাদের হেল্পলাইনে (01604121107) যোগাযোগ করুন।`;
        }
      }
      // Case 8.2: Customer explicitly confirms the order
      else if (hasAllDetails && extracted.isOrderConfirmed) {
        // If customer wants advance payment but hasn't sent TrxID yet
        if (
          (extracted.paymentMethod === 'BKASH' || extracted.paymentMethod === 'NAGAD') &&
          !extracted.transactionId
        ) {
          aiReply = `ধন্যবাদ ${session.name || ''}! অনুগ্রহ করে আমাদের ${extracted.paymentMethod === 'NAGAD' ? 'নগদ' : 'বিকাশ'} নম্বরে মোট ৳${session.cart.finalTotal} পাঠিয়ে TrxID অথবা পেমেন্টের স্ক্রিনশট দিন:\n\n📱 বিকাশ / নগদ (Personal): 01604121107\n💰 মোট প্রদেয়: ৳${session.cart.finalTotal}\n\nটাকা পাঠিয়ে TrxID লিখলেই সাথে সাথে আপনার অর্ডারটি ভেরিফিকেশন ও কনফার্মেশনের জন্য গ্রহণ করা হবে।`;
        } else {
          // Cash on Delivery (COD) order confirmation
          try {
            const order = await OrderServices.createAtomicOrder({
              customerId: customer.id,
              paymentMethod: PaymentMethod.COD,
              sourceChannel: conversation.channel,
            });

            aiReply = `✅ আপনার অর্ডারটি সফলভাবে Confirm করা হয়েছে!\n\n📦 Order ID: ${order.id}\n💰 মোট Payable: ৳${order.totalAmount} (ক্যাশ অন ডেলিভারি)\n📍 ডেলিভারি ঠিকানা: ${customer.fullAddress}, ${customer.district}\n\nআমাদের পক্ষ থেকে পার্সেলটি দ্রুত কুরিয়ারে হস্তান্তর করা হবে। Royal Honey BD-এর সাথে থাকার জন্য ধন্যবাদ ❤️`;
          } catch (err: any) {
            console.error('❌ Order placement failed for COD:', err?.message || err);
            aiReply = `দুঃখিত! ${err?.message || 'অর্ডার সম্পন্ন করা সম্ভব হয়নি।'} অনুগ্রহ করে হেল্পলাইনে যোগাযোগ করুন।`;
          }
        }
      }

      // 9. Standard AI Support Response if not order confirmed
      if (!aiReply) {
        const history = await ChatServices.getRecentConversationHistory(conversation.id, 8);
        aiReply = await AiAgent.generateCustomerReply(
          content,
          customer.name,
          history,
          session,
        );
      }

      // 10. Save AI reply in database
      await ChatServices.saveAiMessage(conversation.id, aiReply);

      // 11. Dispatch reply back to customer channel
      await MessageSender.dispatchReply(channel, channelId, aiReply);

      console.log(`✅ [ChatWorker] Successfully replied to ${channel}:${channelId}`);
      return {
        status: 'completed',
        conversationId: conversation.id,
        cartItemsCount: session.cart.items.length,
        replyLength: aiReply.length,
      };
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    console.log(`🎉 [ChatWorker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [ChatWorker] Job ${job?.id} failed with error:`, err?.message || err);
  });

  return worker;
};
