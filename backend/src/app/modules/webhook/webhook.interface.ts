export interface INormalizedIncomingMessage {
  channel: 'FACEBOOK' | 'WHATSAPP';
  channelId: string;
  messageId: string;
  content: string;
  senderName?: string;
  mediaUrl?: string;
  mediaType?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO';
  timestamp?: number;
}

export interface IMetaWebhookQuery {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
}

export interface IMetaWebhookPayload {
  object?: string;
  entry?: any[];
  // Allow normalized fields directly
  channel?: 'FACEBOOK' | 'WHATSAPP';
  channelId?: string;
  messageId?: string;
  content?: string;
  senderName?: string;
  mediaUrl?: string;
  mediaType?: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO';
}

