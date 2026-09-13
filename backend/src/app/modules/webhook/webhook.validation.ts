import { z } from 'zod';

const normalizedMessageSchema = z.object({
  channel: z.enum(['FACEBOOK', 'WHATSAPP']),
  channelId: z.string().min(1, 'Channel ID is required'),
  messageId: z.string().min(1, 'Message ID is required'),
  content: z.string().min(1, 'Content is required'),
  senderName: z.string().optional(),
  mediaUrl: z.string().url().optional(),
});

export const WebhookValidations = {
  normalizedMessageSchema,
};

