import { Worker, type Job } from 'bullmq';
import { ConversationStatus, PaymentMethod, MessageType, OrderStatus } from '@prisma/client';
import prisma from '../../libs/prisma';
import { CHAT_QUEUE_NAME, redisConnection } from '../../libs/queue';
import { CartServices } from '../cart/cart.service';
import { extractCustomerAndCartEntities } from '../customer/customer.extractor';
import { CustomerServices } from '../customer/customer.service';
import { CustomerSession } from '../customer/customer.session';
import { OrderServices } from '../order/order.service';
import { CourierServices } from '../courier/courier.service';
import { VoiceServices } from '../voice/voice.service';
import { VisionServices } from '../vision/vision.service';
import { VideoServices } from '../video/video.service';
import { ProductServices } from '../products/product.service';
import { OrderAlerts } from '../order/order.alert';
import { AiAgent } from './ai.agent';
import type { IProcessMessageJob } from './chat.interface';
import { ChatServices } from './chat.service';
import { MessageSender } from './message.sender';

export const setupChatWorker = () => {
  const worker = new Worker(
    CHAT_QUEUE_NAME,
    async (job: Job<IProcessMessageJob>) => {
      const { channel, channelId, content, mediaUrl, mediaType } = job.data;
      console.log(`📥 [ChatWorker] Processing message from ${channel}:${channelId} (Type: ${mediaType || 'TEXT'})`);

      // 1. Identify/Create Customer and Conversation
      const { customer, conversation } =
        await ChatServices.getOrCreateCustomerAndConversation(job.data);

      // 2. Detect Media Types
      const isVoiceMessage =
        mediaType === 'AUDIO' ||
        (mediaUrl && !!mediaUrl.match(/\.(ogg|mp3|wav|m4a|aac|opus)/i));

      const isVideoMessage =
        mediaType === 'VIDEO' ||
        (mediaUrl && !isVoiceMessage && !!mediaUrl.match(/\.(mp4|webm|mov|mkv|avi|3gp)/i));

      const isImageMessage =
        mediaType === 'IMAGE' ||
        (mediaUrl && !isVoiceMessage && !isVideoMessage && !mediaUrl.match(/\.(ogg|mp3|wav|m4a|aac|opus|mp4|webm|mov|mkv|avi|3gp)/i));

      let processedText = content;
      let isAmbiguousVoice = false;
      let visionResult: any = null;
      let videoResult: any = null;

      if (isVoiceMessage && mediaUrl) {
        console.log(`🎙️ [ChatWorker] Transcribing customer voice message from ${mediaUrl}...`);
        try {
          const transcriptionResult = await VoiceServices.transcribeBanglaAudio({
            audioUrl: mediaUrl,
            channel,
          });

          if (transcriptionResult.isAmbiguous || !transcriptionResult.text.trim()) {
            console.warn('⚠️ [ChatWorker] Audio transcription is silent or ambiguous');
            isAmbiguousVoice = true;
            processedText = '[অস্পষ্ট বা নিরব ভয়েস মেসেজ]';
          } else {
            processedText = transcriptionResult.text;
            console.log(`📝 [ChatWorker] Transcribed Bangla Voice: "${processedText}"`);
          }

          // Save customer message as AUDIO with transcription
          await ChatServices.saveCustomerMessage(
            conversation.id,
            processedText,
            mediaUrl,
            MessageType.AUDIO,
            { transcription: processedText, provider: transcriptionResult.provider },
          );
        } catch (voiceErr: any) {
          console.error('❌ [ChatWorker] Voice transcription error:', voiceErr?.message || voiceErr);
          isAmbiguousVoice = true;
          processedText = '[ভয়েস মেসেজ প্রসেসিং ত্রুটি]';
          await ChatServices.saveCustomerMessage(
            conversation.id,
            processedText,
            mediaUrl,
            MessageType.AUDIO,
          );
        }
      } else if (isVideoMessage && mediaUrl) {
        console.log(`🎥 [ChatWorker] Analyzing customer video from ${mediaUrl}...`);
        try {
          videoResult = await VideoServices.analyzeCustomerVideo({
            videoUrl: mediaUrl,
            channel,
          });
          console.log(`🎥 [ChatWorker] Video analyzed: Speech="${videoResult.speechTranscript}", Damaged=${videoResult.isDamaged}`);

          if (videoResult.speechTranscript) {
            processedText = videoResult.speechTranscript;
          } else if (videoResult.visualSummary) {
            processedText = `[ভিডিওতে প্রদর্শিত দৃশ্য: ${videoResult.visualSummary}]`;
          } else {
            processedText = content || '[ভিডিও মেসেজ]';
          }

          await ChatServices.saveCustomerMessage(
            conversation.id,
            content ? `${content}\n${videoResult.combinedContext}` : videoResult.combinedContext,
            mediaUrl,
            MessageType.VIDEO,
            { video: videoResult },
          );
        } catch (videoErr: any) {
          console.error('❌ [ChatWorker] Video processing error:', videoErr?.message || videoErr);
          await ChatServices.saveCustomerMessage(
            conversation.id,
            content || '[ভিডিও মেসেজ]',
            mediaUrl,
            MessageType.VIDEO,
          );
        }
      } else if (isImageMessage && mediaUrl) {
        console.log(`🖼️ [ChatWorker] Analyzing customer image via Vision LLM from ${mediaUrl}...`);
        try {
          visionResult = await VisionServices.analyzeCustomerImage({ imageUrl: mediaUrl });
          console.log(`👁️ [ChatWorker] Vision classification: ${visionResult.imageCategory} (Confidence: ${visionResult.confidence})`);

          await ChatServices.saveCustomerMessage(
            conversation.id,
            content || `[ছবি পাঠানো হয়েছে: ${visionResult.description || visionResult.imageCategory}]`,
            mediaUrl,
            MessageType.IMAGE,
            { vision: visionResult },
          );
        } catch (imgErr: any) {
          console.error('❌ [ChatWorker] Image analysis error:', imgErr?.message || imgErr);
          await ChatServices.saveCustomerMessage(
            conversation.id,
            content || '[ছবি পাঠানো হয়েছে]',
            mediaUrl,
            MessageType.IMAGE,
          );
        }
      } else {
        // Save normal text message
        await ChatServices.saveCustomerMessage(conversation.id, content, undefined, MessageType.TEXT);
      }

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

      // 3.1 Ambiguous or silent voice clarification
      if (isAmbiguousVoice) {
        const clarifyReply =
          'দুঃখিত! আপনার ভয়েস মেসেজটি স্পষ্ট বোঝা যায়নি। অনুগ্রহ করে একটু স্পষ্ট করে আবার ভয়েস পাঠান অথবা লিখে জানান ❤️';
        await ChatServices.saveAiMessage(conversation.id, clarifyReply);
        await MessageSender.dispatchReply(channel, channelId, clarifyReply);
        return {
          status: 'completed',
          reason: 'ambiguous_voice_clarification_sent',
          conversationId: conversation.id,
        };
      }

      // 3.2 Video / Vision Branch: Damaged Jar / Packaging Complaint (Section 30)
      if (videoResult?.isDamaged || visionResult?.imageCategory === 'COMPLAINT_DAMAGE') {
        const damageReply =
          'আপনার পাঠানো ভিডিও/ছবিটি আমরা পর্যালোচনা করেছি। পার্সেল বা মধুর বয়াম ক্ষতিগ্রস্ত হওয়ার জন্য আমরা আন্তরিকভাবে দুঃখিত!\n\nRoyal Honey BD-এর নিয়ম অনুযায়ী ডেলিভারিতে পার্সেল বা বয়াম ক্ষতিগ্রস্ত হলে আমরা সম্পূর্ণ বিনামূল্যে নতুন পার্সেল রিপ্লেস করে দিই।\n\nবিষয়টি এখনই অগ্রাধিকার ভিত্তিতে আমাদের সাপোর্ট টিম ও ওনারের কাছে পাঠানো হয়েছে। খুব দ্রুত আমাদের একজন প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।\n\nজরুরি প্রয়োজনে হেল্পলাইনেও সরাসরি যোগাযোগ করতে পারেন: 01604121107 ❤️';

        await ChatServices.takeoverConversation(conversation.id);
        await ChatServices.saveAiMessage(conversation.id, damageReply);
        await MessageSender.dispatchReply(channel, channelId, damageReply);
        return {
          status: 'completed',
          reason: 'damage_complaint_handoff',
          conversationId: conversation.id,
        };
      }

      // 3.3 Video Branch: Silent / Unclear Video without text
      if (videoResult?.isUnclear && (!content || !content.trim())) {
        const unclearReply =
          'আপনার পাঠানো ভিডিওটিতে কোনো স্পষ্ট বক্তব্য বা বিষয় বোঝা যায়নি। অনুগ্রহ করে কী উদ্দেশ্যে ভিডিওটি পাঠিয়েছেন তা একটু লিখে বা স্পষ্ট করে জানান ❤️';
        await ChatServices.saveAiMessage(conversation.id, unclearReply);
        await MessageSender.dispatchReply(channel, channelId, unclearReply);
        return {
          status: 'completed',
          reason: 'unclear_video_reply',
          conversationId: conversation.id,
        };
      }

      // 3.4 Video Branch: Product Inquiry via Video
      if (videoResult?.detectedProduct && (!content || !content.trim()) && !videoResult.speechTranscript) {
        const prodReply = `ধন্যবাদ! আপনার ভিডিওতে প্রদর্শিত পণ্যটি আমাদের "${videoResult.detectedProduct}"।\n\n💰 এটি অর্ডার করতে চাইলে আপনার ডেলিভারি ঠিকানা এবং কয়টি জার প্রয়োজন লিখে বা ভয়েসে জানান ❤️`;
        await ChatServices.saveAiMessage(conversation.id, prodReply);
        await MessageSender.dispatchReply(channel, channelId, prodReply);
        return {
          status: 'completed',
          reason: 'product_inquiry_from_video',
          conversationId: conversation.id,
        };
      }

      // 3.5 Vision Branch: Unclear / Blurry Image
      if (visionResult?.imageCategory === 'UNCLEAR') {
        const unclearReply =
          'আপনার পাঠানো ছবিটি পরিষ্কারভাবে বোঝা যাচ্ছে না। অনুগ্রহ করে একটু স্পষ্ট ছবি অথবা আপনি কী জানতে বা অর্ডার করতে চান তা লিখে জানান ❤️';
        await ChatServices.saveAiMessage(conversation.id, unclearReply);
        await MessageSender.dispatchReply(channel, channelId, unclearReply);
        return {
          status: 'completed',
          reason: 'unclear_image_reply',
          conversationId: conversation.id,
        };
      }

      // 3.4 Vision Branch: Product Inquiry via Photo (Product Catalog Matching)
      if (visionResult?.imageCategory === 'PRODUCT_INQUIRY') {
        const prodId = visionResult.productMatch?.matchedProductId;
        let prodName = visionResult.productMatch?.productName || 'আমাদের খাঁটি মধু';
        let prodPrice = 200;
        let prodWeight = '250 গ্রাম';
        let prodDesc = '';

        if (prodId) {
          try {
            const prod = await ProductServices.getProductById(prodId);
            if (prod) {
              prodName = prod.name;
              prodPrice = prod.price;
              prodWeight = prod.weight;
              prodDesc = prod.description || '';
            }
          } catch { }
        }

        const prodReply = `ধন্যবাদ! ছবিতে প্রদর্শিত পণ্যটি আমাদের "${prodName}" (${prodWeight})।\n\n💰 মূল্য: ৳${prodPrice}\n${prodDesc ? `📝 বিবরণ: ${prodDesc}\n` : ''}🚚 ডেলিভারি চার্জ: ঢাকা ৬০৳ / ঢাকার বাইরে ১২০৳\n\nআপনি কি এটি অর্ডার করতে চান? কতটি জার লাগবে এবং আপনার ডেলিভারি ঠিকানা জানাবেন ❤️`;

        await ChatServices.saveAiMessage(conversation.id, prodReply);
        await MessageSender.dispatchReply(channel, channelId, prodReply);
        return {
          status: 'completed',
          reason: 'product_inquiry_from_image',
          conversationId: conversation.id,
        };
      }

      // 4. Hydrate Customer Session (Redis Cache + PostgreSQL fallback)
      let activeCustomerId = customer.id;
      let session = await CustomerSession.getSession(activeCustomerId);

      // 4.1 Vision Branch: Address Proof (Handwritten / Typed screenshot extraction)
      if (visionResult?.imageCategory === 'ADDRESS_PROOF' && visionResult.addressData) {
        session = await CustomerServices.updateCustomerProfile(
          activeCustomerId,
          visionResult.addressData,
        );
        activeCustomerId = session.customerId;
      }

      // Fetch recent messages for extraction context
      const recentHistory = await ChatServices.getCrossChannelMessageHistory(activeCustomerId, 4);

      // 5. Extract Customer Details, Cart Actions, Payment Method & Confirmation Intent via OpenAI
      const extracted = await extractCustomerAndCartEntities(processedText, {
        currentCart: session.cart.items,
        recentMessages: recentHistory.map((m) => ({ sender: m.sender, content: m.content })),
      });

      // If vision detected payment proof, merge payment fields
      if (visionResult?.imageCategory === 'PAYMENT_PROOF' && visionResult.paymentData) {
        if (visionResult.paymentData.transactionId) {
          extracted.transactionId = visionResult.paymentData.transactionId;
        }
        if (visionResult.paymentData.paymentMethod) {
          extracted.paymentMethod = visionResult.paymentData.paymentMethod;
        }
      }

      // 6. Apply Customer Profile Updates (Name, Phone, Address, District)
      if (extracted.customerInfo && Object.keys(extracted.customerInfo).length > 0) {
        session = await CustomerServices.updateCustomerProfile(
          activeCustomerId,
          extracted.customerInfo,
        );
        activeCustomerId = session.customerId;
      }

      // 7. Apply Cart Modifications (Real-time Stock Validation)
      if (extracted.cartActions && extracted.cartActions.length > 0) {
        for (const cartAction of extracted.cartActions) {
          const qty = cartAction.quantity || 1;
          let productIdentifier = cartAction.productId || cartAction.productKeyword;
          // Fallback: If identifier not explicitly returned but customer has 1 product in cart, update that product
          if (!productIdentifier && session.cart.items.length === 1) {
            productIdentifier = session.cart.items[0].productId;
          }
          if (cartAction.action === 'ADD') {
            await CartServices.addItemToCart(
              activeCustomerId,
              productIdentifier,
              qty,
              session.district,
            );
          } else if (cartAction.action === 'UPDATE') {
            await CartServices.updateItemQuantity(
              activeCustomerId,
              productIdentifier,
              qty,
              session.district,
            );
          } else if (cartAction.action === 'REMOVE') {
            await CartServices.removeItemFromCart(
              activeCustomerId,
              productIdentifier,
              session.district,
            );
          } else if (cartAction.action === 'CLEAR') {
            await CartServices.clearCart(activeCustomerId);
          }
        }
        // Refresh session after cart changes
        session = await CustomerSession.getSession(activeCustomerId);
      }

      let aiReply = '';

      // 8. Phase 4 & Phase 8: Atomic Order & Payment Proof OCR Handling
      const hasAllDetails = session.missingFields.length === 0 && session.cart.items.length > 0;
      const isPaymentProof = visionResult?.imageCategory === 'PAYMENT_PROOF' || !!extracted.transactionId;

      // Case 8.0: Customer has already placed an order awaiting payment, and now sends screenshot
      const existingPendingOrder = await prisma.order.findFirst({
        where: {
          customerId: activeCustomerId,
          orderStatus: OrderStatus.PAYMENT_VERIFICATION_PENDING,
        },
        orderBy: { createdAt: 'desc' },
        include: { customer: true, items: true },
      });

      if (existingPendingOrder && isPaymentProof) {
        const detectedTrxId =
          extracted.transactionId ||
          visionResult?.paymentData?.transactionId ||
          existingPendingOrder.transactionId ||
          'স্ক্রিনশট প্রদান করা হয়েছে';

        const updatedOrder = await prisma.order.update({
          where: { id: existingPendingOrder.id },
          data: {
            transactionId: detectedTrxId,
            paymentProofUrl: mediaUrl || existingPendingOrder.paymentProofUrl,
            paymentMethod:
              extracted.paymentMethod === 'NAGAD' ? PaymentMethod.NAGAD : PaymentMethod.BKASH,
          },
          include: { customer: true, items: true },
        });

        // Trigger owner alert with screenshot preview
        OrderAlerts.sendAdvancePaymentAlert(updatedOrder, updatedOrder.customer).catch((err) =>
          console.error('Error in sendAdvancePaymentAlert:', err),
        );

        const amountStr = visionResult?.paymentData?.amount
          ? `\n💰 এক্সট্র্যাক্ট করা অ্যামাউন্ট: ৳${visionResult.paymentData.amount}`
          : '';

        aiReply = `আপনার পেমেন্টের স্ক্রিনশট আমরা পেয়েছি।\n\n📌 ট্রানজেকশন আইডি (TrxID): ${detectedTrxId}${amountStr}\n\nআমাদের অ্যাকাউন্টস টিম স্টেটমেন্টের সাথে পেমেন্টটি ভেরিফাই করার সাথে সাথেই আপনার অর্ডারটি কনফার্ম করে জানিয়ে দেওয়া হবে। সাধারণত ৫-১০ মিনিট সময় লাগতে পারে।\n\n📦 অর্ডার আইডি: ${updatedOrder.id}\n📍 ডেলিভারি ঠিকানা: ${session.fullAddress || customer.fullAddress}, ${session.district || customer.district}\n\nধৈর্য ধরার জন্য ধন্যবাদ ❤️`;
      }
      // Case 8.1: Customer submits Advance Payment Transaction ID (TrxID) or payment screenshot with active cart
      else if (hasAllDetails && isPaymentProof) {
        try {
          const method =
            extracted.paymentMethod === 'NAGAD' ? PaymentMethod.NAGAD : PaymentMethod.BKASH;
          const detectedTrxId =
            extracted.transactionId ||
            visionResult?.paymentData?.transactionId ||
            'স্ক্রিনশট প্রদান করা হয়েছে';

          const order = await OrderServices.createAtomicOrder({
            customerId: activeCustomerId,
            paymentMethod: method,
            transactionId: detectedTrxId,
            paymentProofUrl: mediaUrl || undefined,
            sourceChannel: conversation.channel,
          });

          const amountStr = visionResult?.paymentData?.amount
            ? `\n💰 এক্সট্র্যাক্ট করা অ্যামাউন্ট: ৳${visionResult.paymentData.amount}`
            : '';

          aiReply = `আপনার পেমেন্টের তথ্য (TrxID: ${detectedTrxId}) আমরা পেয়েছি।${amountStr}\n\nআমাদের অ্যাকাউন্টস টিম পেমেন্টটি ভেরিফাই করার সাথে সাথেই আপনার অর্ডারটি কনফার্ম করে জানিয়ে দেওয়া হবে। সাধারণত ৫-১০ মিনিট সময় লাগতে পারে।\n\n📦 অর্ডার আইডি: ${order.id}\n💰 মোট প্রদেয়: ৳${order.totalAmount}\n📍 ডেলিভারি ঠিকানা: ${session.fullAddress || customer.fullAddress}, ${session.district || customer.district}\n\nধৈর্য ধরার জন্য ধন্যবাদ ❤️`;
        } catch (err: any) {
          console.error('❌ Order placement failed with TrxID/Screenshot:', err?.message || err);
          aiReply = `দুঃখিত! ${err?.message || 'অর্ডার সম্পন্ন করা সম্ভব হয়নি।'} অনুগ্রহ করে আমাদের হেল্পলাইনে (01604121107) যোগাযোগ করুন।`;
        }
      }
      // Check if order summary was actually presented to the customer in recent messages
      const summaryWasShown = recentHistory.some(
        (m) =>
          m.sender === 'AI_BOT' &&
          (m.content.includes('প্রদান করতে হবে') ||
            m.content.includes('টোটাল প্রোডাক্ট প্রাইস') ||
            m.content.includes('অর্ডারের সব তথ্য সঠিক আছে কি') ||
            m.content.includes('Confirm করলে') ||
            m.content.includes('অর্ডার সামারি')),
      );

      // Case 8.2: Customer explicitly confirms the order AFTER being presented with the summary
      if (hasAllDetails && extracted.isOrderConfirmed && summaryWasShown) {
        const customerGreeting = session.name ? `${session.name} ভাইয়া` : 'ভাইয়া';
        if (
          (extracted.paymentMethod === 'BKASH' || extracted.paymentMethod === 'NAGAD') &&
          !extracted.transactionId
        ) {
          aiReply = `ধন্যবাদ ${customerGreeting}! অনুগ্রহ করে আমাদের ${extracted.paymentMethod === 'NAGAD' ? 'নগদ' : 'বিকাশ'} নম্বরে মোট ৳${session.cart.finalTotal} পাঠিয়ে TrxID অথবা পেমেন্টের স্ক্রিনশট দিন:\n\n📱 বিকাশ / নগদ (Personal): 01604121107\n💰 মোট প্রদেয়: ৳${session.cart.finalTotal}\n\nটাকা পাঠানো হলে TrxID লিখে দিলেই বা স্ক্রিনশট পাঠালেই সাথে সাথে আমরা ভেরিফাই করে আপনার অর্ডারটি কনফার্ম করে দেব ভাইয়া। 😊`;
        } else {
          // Cash on Delivery (COD) order confirmation
          try {
            const order = await OrderServices.createAtomicOrder({
              customerId: activeCustomerId,
              paymentMethod: PaymentMethod.COD,
              sourceChannel: conversation.channel,
            });

            // Phase 5: Auto-book parcel in courier
            let trackingInfo = '';
            try {
              const booked = await CourierServices.bookOrderParcel(order.id);
              if (booked.trackingCode) {
                trackingInfo = `\n🚚 কুরিয়ার ট্র্যাকিং কোড: ${booked.trackingCode} (${booked.courierProvider || 'Steadfast'})`;
              }
            } catch (courierErr) {
              console.warn('⚠️ Auto courier booking failed:', courierErr);
            }

            const customerGreeting = session.name ? `${session.name} ভাইয়া` : 'ভাইয়া';
            const deliveryTimeline = CustomerServices.getDeliveryTimelineString(
              session.district || customer.district,
            );

            aiReply = `আলহামদুলিল্লাহ ${customerGreeting}! আপনার অর্ডারটি সফলভাবে কনফার্ম করেছি। ❤️\n\n📦 অর্ডার আইডি: #${order.id}${trackingInfo}\n💰 মোট বিল: ৳${order.totalAmount} (ক্যাশ অন ডেলিভারি)\n📍 ডেলিভারি ঠিকানা: ${session.fullAddress || customer.fullAddress}, ${session.district || customer.district}\n\n${deliveryTimeline} ডেলিভারিম্যান আপনার সাথে যোগাযোগ করে পার্সেলটি পৌঁছে দেবে। ডেলিভারির সময় পণ্য হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন।\n\nRoyal Honey BD-এর সাথে থাকার জন্য অসংখ্য ধন্যবাদ! কোনো প্রশ্ন থাকলে নির্দ্বিধায় জানাবেন। 😊`;
          } catch (err: any) {
            console.error('❌ Order placement failed for COD:', err?.message || err);
            aiReply = `দুঃখিত ভাইয়া! এই মুহূর্তে অর্ডার সম্পন্ন করতে একটু সমস্যা হয়েছে। অনুগ্রহ করে আমাদের হেল্পলাইনে (01604121107) একটু জানান, আমরা ঠিক করে দিচ্ছি।`;
          }
        }
      }

      // 9. Standard AI Support Response if not order confirmed (Phase 10: Cross-Channel Message History)
      if (!aiReply) {
        const history = await ChatServices.getCrossChannelMessageHistory(activeCustomerId, 8);
        aiReply = await AiAgent.generateCustomerReply(
          processedText,
          session.name || customer.name,
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
