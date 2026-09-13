import { Worker, type Job } from 'bullmq';
import { ConversationStatus } from '@prisma/client';
import { CHAT_QUEUE_NAME, redisConnection } from '../../libs/queue';
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

      // 4. Retrieve recent conversation history for context
      const history = await ChatServices.getRecentConversationHistory(conversation.id, 8);

      // 5. Generate AI Support Response via OpenAI & RAG
      const aiReply = await AiAgent.generateCustomerReply(
        content,
        customer.name,
        history,
      );

      // 6. Save AI reply in database
      await ChatServices.saveAiMessage(conversation.id, aiReply);

      // 7. Dispatch reply back to customer channel
      await MessageSender.dispatchReply(channel, channelId, aiReply);

      console.log(`✅ [ChatWorker] Successfully replied to ${channel}:${channelId}`);
      return {
        status: 'completed',
        conversationId: conversation.id,
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

