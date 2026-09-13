import {
  ConversationStatus,
  CustomerChannelEnum,
  MessageType,
  SenderType,
} from '@prisma/client';
import prisma from '../../libs/prisma';
import type { IProcessMessageJob, IRecentMessageContext } from './chat.interface';

const getOrCreateCustomerAndConversation = async (job: IProcessMessageJob) => {
  let channelUser = await prisma.channelUser.findUnique({
    where: {
      channel_channelId: {
        channel: job.channel,
        channelId: job.channelId,
      },
    },
    include: { customer: true },
  });

  let customerId: string;

  if (!channelUser) {
    const isWhatsApp = job.channel === CustomerChannelEnum.WHATSAPP;
    const phone = isWhatsApp ? job.channelId : null;

    // Check if customer with this phone already exists
    let existingCustomer = phone
      ? await prisma.customer.findUnique({ where: { phone } })
      : null;

    if (!existingCustomer) {
      existingCustomer = await prisma.customer.create({
        data: {
          name: job.senderName || null,
          phone,
        },
      });
    }

    customerId = existingCustomer.id;

    channelUser = await prisma.channelUser.create({
      data: {
        customerId,
        channel: job.channel,
        channelId: job.channelId,
      },
      include: { customer: true },
    });
  } else {
    customerId = channelUser.customerId;
    // Update name if customer had no name and senderName is provided
    if (!channelUser.customer.name && job.senderName) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { name: job.senderName },
      });
    }
  }

  // Find active conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      customerId,
      channel: job.channel,
      status: { in: [ConversationStatus.AI_ACTIVE, ConversationStatus.HUMAN_TAKEOVER] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        customerId,
        channel: job.channel,
        status: ConversationStatus.AI_ACTIVE,
      },
    });
  }

  return {
    customer: channelUser.customer,
    conversation,
  };
};

const saveCustomerMessage = async (
  conversationId: string,
  content: string,
  mediaUrl?: string,
) => {
  const msgType = mediaUrl ? MessageType.IMAGE : MessageType.TEXT;

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        sender: SenderType.CUSTOMER,
        messageType: msgType,
        content,
        mediaUrl: mediaUrl || null,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return message;
};

const getRecentConversationHistory = async (
  conversationId: string,
  limit = 8,
): Promise<IRecentMessageContext[]> => {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      sender: true,
      content: true,
      createdAt: true,
    },
  });

  return messages.reverse();
};

const saveAiMessage = async (conversationId: string, content: string) => {
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        sender: SenderType.AI_BOT,
        messageType: MessageType.TEXT,
        content,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return message;
};

export const ChatServices = {
  getOrCreateCustomerAndConversation,
  saveCustomerMessage,
  getRecentConversationHistory,
  saveAiMessage,
};

