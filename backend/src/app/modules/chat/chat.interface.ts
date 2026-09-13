import type { CustomerChannelEnum, SenderType } from '@prisma/client';

export interface IProcessMessageJob {
  channel: CustomerChannelEnum;
  channelId: string;
  messageId: string;
  content: string;
  senderName?: string;
  mediaUrl?: string;
  timestamp?: number;
}

export interface IRecentMessageContext {
  sender: SenderType;
  content: string;
  createdAt: Date;
}

