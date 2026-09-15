import {
  ConversationStatus,
  CustomerChannelEnum,
  MessageType,
  SenderType,
} from '@prisma/client';
import prisma from '../../libs/prisma';
import type { IProcessMessageJob, IRecentMessageContext } from './chat.interface';
import { CustomerIdentityService } from '../customer/customer.identity';

const getOrCreateCustomerAndConversation = async (job: IProcessMessageJob) => {
  const result = await CustomerIdentityService.resolveCustomerIdentity(job);
  return {
    customer: result.customer,
    conversation: result.conversation,
    wasCrossChannelMerged: result.wasCrossChannelMerged,
  };
};

const saveCustomerMessage = async (
  conversationId: string,
  content: string,
  mediaUrl?: string,
  messageType?: MessageType,
  metadata?: any,
) => {
  let msgType = messageType;
  if (!msgType) {
    if (mediaUrl) {
      if (mediaUrl.match(/\.(ogg|mp3|wav|m4a|aac|opus)/i)) {
        msgType = MessageType.AUDIO;
      } else if (mediaUrl.match(/\.(mp4|webm|mov|mkv|avi|3gp)/i)) {
        msgType = MessageType.VIDEO;
      } else {
        msgType = MessageType.IMAGE;
      }
    } else {
      msgType = MessageType.TEXT;
    }
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        sender: SenderType.CUSTOMER,
        messageType: msgType,
        content,
        mediaUrl: mediaUrl || null,
        metadata: metadata || null,
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
    emitSocketEvent('message:new', payload, [`conversation:${conversationId}`, 'admin']);
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

/**
 * Get chronological recent message history across ALL channels for a unified customer
 */
const getCrossChannelMessageHistory = async (
  customerId: string,
  limit = 10,
): Promise<Array<IRecentMessageContext & { channel: CustomerChannelEnum }>> => {
  const messages = await prisma.message.findMany({
    where: {
      conversation: {
        customerId,
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      conversation: {
        select: { channel: true },
      },
    },
  });

  return messages.reverse().map((msg) => ({
    sender: msg.sender,
    content: msg.content,
    createdAt: msg.createdAt,
    channel: msg.conversation.channel,
  }));
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
    emitSocketEvent('message:new', payload, [`conversation:${conversationId}`, 'admin']);
  } catch (socketErr) {
    console.warn('⚠️ [Socket.io] Failed to emit AI message:', socketErr);
  }

  return message;
};

/**
 * Get all conversations with customer profile, status, last message, and aggregate stats
 */
const getAllConversations = async (filters: {
  status?: ConversationStatus;
  channel?: CustomerChannelEnum;
  category?: 'ALL' | 'UNREPLIED' | 'ORDERED' | 'INCOMPLETE_CART' | 'TAKEOVER' | 'AI_ACTIVE';
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
          channelUsers: true,
          orders: {
            select: { id: true, orderStatus: true, totalAmount: true },
          },
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

  const mapped = conversations.map((conv) => {
    const lastMsg = conv.messages[0];
    const latestHandoff = conv.humanHandoffs[0];
    const activeCart = conv.customer.carts[0];
    const ordersCount = conv.customer.orders?.length || 0;
    const hasOrdered = ordersCount > 0;
    const isUnreplied = !!lastMsg && lastMsg.sender === SenderType.CUSTOMER;
    const hasActiveCart = (activeCart?.items?.length || 0) > 0;

    return {
      id: conv.id,
      channel: conv.channel,
      status: conv.status,
      lastMessageAt: conv.lastMessageAt,
      isUnreplied,
      hasOrdered,
      hasActiveCart,
      ordersCount,
      customer: {
        id: conv.customer.id,
        name: conv.customer.name,
        phone: conv.customer.phone,
        district: conv.customer.district,
        thana: conv.customer.thana,
        fullAddress: conv.customer.fullAddress,
        linkedChannels: conv.customer.channelUsers?.map((cu) => cu.channel) || [],
        ordersCount,
        hasOrdered,
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

  const stats = {
    total: mapped.length,
    unreplied: mapped.filter((c) => c.isUnreplied).length,
    ordered: mapped.filter((c) => c.hasOrdered).length,
    incompleteCart: mapped.filter((c) => c.hasActiveCart && !c.hasOrdered).length,
    takeover: mapped.filter((c) => c.status === ConversationStatus.HUMAN_TAKEOVER).length,
    aiActive: mapped.filter((c) => c.status === ConversationStatus.AI_ACTIVE).length,
    messenger: mapped.filter((c) => c.channel === CustomerChannelEnum.FACEBOOK).length,
    whatsapp: mapped.filter((c) => c.channel === CustomerChannelEnum.WHATSAPP).length,
    instagram: 0,
    website: 0,
  };

  let filtered = mapped;
  if (filters.category === 'UNREPLIED') {
    filtered = mapped.filter((c) => c.isUnreplied);
  } else if (filters.category === 'ORDERED') {
    filtered = mapped.filter((c) => c.hasOrdered);
  } else if (filters.category === 'INCOMPLETE_CART') {
    filtered = mapped.filter((c) => c.hasActiveCart && !c.hasOrdered);
  } else if (filters.category === 'TAKEOVER') {
    filtered = mapped.filter((c) => c.status === ConversationStatus.HUMAN_TAKEOVER);
  } else if (filters.category === 'AI_ACTIVE') {
    filtered = mapped.filter((c) => c.status === ConversationStatus.AI_ACTIVE);
  }

  return {
    conversations: filtered,
    stats,
  };
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
          channelUsers: true,
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
    include: {
      conversation: {
        select: { channel: true },
      },
    },
  });

  return {
    conversation: {
      ...conversation,
      customer: {
        ...conversation.customer,
        linkedChannels: conversation.customer.channelUsers?.map((cu) => cu.channel) || [],
      },
    },
    messages: messages.map((m) => ({
      ...m,
      channel: m.conversation?.channel || conversation.channel,
    })),
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
  emitSocketEvent('message:new', payload, [`conversation:${conversationId}`, 'admin']);
  emitSocketEvent('new_message', { conversationId, message });

  return message;
};

export const ChatServices = {
  getOrCreateCustomerAndConversation,
  saveCustomerMessage,
  getRecentConversationHistory,
  getCrossChannelMessageHistory,
  saveAiMessage,
  getAllConversations,
  getConversationMessages,
  takeoverConversation,
  resumeAi,
  sendAgentReply,
};

