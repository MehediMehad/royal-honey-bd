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

  // Emit real-time event to admin and active conversation room
  try {
    const { emitSocketEvent } = await import('../../libs/socket');
    const payload = {
      ...message,
      text: message.content,
      sender: message.sender,
    };
    emitSocketEvent('message:new', payload, `conversation:${conversationId}`);
    emitSocketEvent('message:new', payload);
  } catch (socketErr) {
    console.warn('⚠️ [Socket.io] Failed to emit customer message:', socketErr);
  }

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

  // Emit real-time event to admin and active conversation room
  try {
    const { emitSocketEvent } = await import('../../libs/socket');
    const payload = {
      ...message,
      text: message.content,
      sender: message.sender,
    };
    emitSocketEvent('message:new', payload, `conversation:${conversationId}`);
    emitSocketEvent('message:new', payload);
  } catch (socketErr) {
    console.warn('⚠️ [Socket.io] Failed to emit AI message:', socketErr);
  }

  return message;
};

/**
 * Get all conversations with customer profile, status, and last message
 */
const getAllConversations = async (filters: {
  status?: ConversationStatus;
  channel?: CustomerChannelEnum;
  searchTerm?: string;
}) => {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.channel) where.channel = filters.channel;

  if (filters.searchTerm) {
    where.customer = {
      OR: [
        { name: { contains: filters.searchTerm, mode: 'insensitive' } },
        { phone: { contains: filters.searchTerm, mode: 'insensitive' } },
      ],
    };
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    include: {
      customer: {
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
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      humanHandoffs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return conversations.map((conv) => {
    const lastMsg = conv.messages[0];
    const latestHandoff = conv.humanHandoffs[0];
    const activeCart = conv.customer.carts[0];

    return {
      id: conv.id,
      channel: conv.channel,
      status: conv.status,
      lastMessageAt: conv.lastMessageAt,
      customer: {
        id: conv.customer.id,
        name: conv.customer.name,
        phone: conv.customer.phone,
        district: conv.customer.district,
        thana: conv.customer.thana,
        fullAddress: conv.customer.fullAddress,
        cartItemsCount: activeCart?.items?.length || 0,
        cartTotal: (activeCart?.items || []).reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        ),
      },
      lastMessage: lastMsg
        ? {
          sender: lastMsg.sender,
          content: lastMsg.content,
          createdAt: lastMsg.createdAt,
        }
        : null,
      humanHandoff: latestHandoff
        ? {
          status: latestHandoff.status,
          reason: latestHandoff.reason,
          assignedAdmin: latestHandoff.assignedAdmin,
        }
        : null,
    };
  });
};

/**
 * Get message history for a specific conversation
 */
const getConversationMessages = async (conversationId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      customer: {
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
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      },
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  return {
    conversation,
    messages,
  };
};

/**
 * 1-Click Human Agent Takeover
 */
const takeoverConversation = async (
  conversationId: string,
  adminUserId?: string,
) => {
  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: ConversationStatus.HUMAN_TAKEOVER,
    },
    include: { customer: true },
  });

  // Create or update HumanHandoff
  await prisma.humanHandoff.create({
    data: {
      conversationId,
      reason: 'Admin manually initiated 1-click takeover',
      status: 'IN_PROGRESS',
      assignedAdmin: adminUserId || 'ADMIN',
    },
  });

  // Broadcast socket event
  const { emitSocketEvent } = await import('../../libs/socket');
  emitSocketEvent('conversation_status_change', {
    conversationId,
    status: ConversationStatus.HUMAN_TAKEOVER,
    assignedAdmin: adminUserId || 'ADMIN',
  });

  return updated;
};

/**
 * Resume AI Conversation
 */
const resumeAi = async (conversationId: string) => {
  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: ConversationStatus.AI_ACTIVE,
    },
    include: { customer: true },
  });

  // Mark latest open handoff as resolved
  await prisma.humanHandoff.updateMany({
    where: {
      conversationId,
      status: { in: ['OPEN', 'IN_PROGRESS'] },
    },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
  });

  // Broadcast socket event
  const { emitSocketEvent } = await import('../../libs/socket');
  emitSocketEvent('conversation_status_change', {
    conversationId,
    status: ConversationStatus.AI_ACTIVE,
  });

  return updated;
};

/**
 * Send live agent reply to customer
 */
const sendAgentReply = async (
  conversationId: string,
  content: string,
  adminUserId?: string,
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      customer: {
        include: {
          channelUsers: true,
        },
      },
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Create message record
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        sender: SenderType.HUMAN_AGENT,
        messageType: MessageType.TEXT,
        content,
        metadata: { adminUserId: adminUserId || 'ADMIN' },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  // Find recipient channel user (WhatsApp or Facebook)
  const channelUser = conversation.customer.channelUsers.find(
    (cu) => cu.channel === conversation.channel,
  );

  if (channelUser) {
    const { MessageSender } = await import('./message.sender');
    await MessageSender.dispatchReply(
      conversation.channel,
      channelUser.channelId,
      content,
    );
  }

  // Broadcast socket event (emit both message:new and new_message for compatibility)
  const { emitSocketEvent } = await import('../../libs/socket');
  const payload = {
    ...message,
    text: message.content,
    sender: message.sender,
  };
  emitSocketEvent('message:new', payload, `conversation:${conversationId}`);
  emitSocketEvent('message:new', payload);
  emitSocketEvent('new_message', { conversationId, message });

  return message;
};

export const ChatServices = {
  getOrCreateCustomerAndConversation,
  saveCustomerMessage,
  getRecentConversationHistory,
  saveAiMessage,
  getAllConversations,
  getConversationMessages,
  takeoverConversation,
  resumeAi,
  sendAgentReply,
};

