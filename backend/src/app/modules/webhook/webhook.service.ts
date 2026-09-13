import config from '../../../configs';
import { chatMessageQueue } from '../../libs/queue';
import type {
  IMetaWebhookPayload,
  IMetaWebhookQuery,
  INormalizedIncomingMessage,
} from './webhook.interface';

const verifyWebhook = (query: Record<string, any>): string | null => {
  const mode = query['hub.mode'] || query['hub_mode'] || query.mode;
  const token = query['hub.verify_token'] || query['hub_verify_token'] || query.verify_token;
  const challenge = query['hub.challenge'] || query['hub_challenge'] || query.challenge;

  const expectedToken = (
    process.env.META_VERIFY_TOKEN ||
    config.meta.verifyToken ||
    'royal_honey_verify_token'
  )
    .replace(/^["']|["']$/g, '')
    .trim();

  const receivedToken = String(token || '')
    .replace(/^["']|["']$/g, '')
    .trim();

  console.log('🔍 Webhook Verification Attempt:');
  console.log(`- Mode: ${mode}`);
  console.log(`- Received Token: "${receivedToken}"`);
  console.log(`- Expected Token: "${expectedToken}"`);
  console.log(`- Challenge: ${challenge}`);

  if (mode === 'subscribe' && receivedToken === expectedToken) {
    console.log('✅ Webhook Verified successfully!');
    return challenge ? String(challenge) : '';
  }

  console.warn('❌ Webhook Verification Failed: Token or Mode mismatch');
  return null;
};

const extractMessagesFromPayload = (
  payload: IMetaWebhookPayload,
): INormalizedIncomingMessage[] => {
  const messages: INormalizedIncomingMessage[] = [];

  // Case 1: Already normalized (e.g. from n8n or direct API test)
  if (payload.channel && payload.channelId && (payload.content || payload.mediaUrl)) {
    const isAudio =
      payload.mediaType === 'AUDIO' ||
      !!payload.mediaUrl?.match(/\.(ogg|mp3|wav|m4a|aac|opus)/i);

    messages.push({
      channel: payload.channel,
      channelId: String(payload.channelId),
      messageId: payload.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      content: (payload.content || (isAudio ? '[Voice Message]' : '')).trim(),
      senderName: payload.senderName,
      mediaUrl: payload.mediaUrl,
      mediaType: isAudio ? 'AUDIO' : payload.mediaType || 'TEXT',
      timestamp: Date.now(),
    });
    return messages;
  }

  // Case 2: Facebook Messenger Webhook
  if (payload.object === 'page' && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      if (Array.isArray(entry.messaging)) {
        for (const msgEvent of entry.messaging) {
          // Skip if message was sent by page itself (echo)
          if (msgEvent.message?.is_echo) continue;

          const senderId = msgEvent.sender?.id;
          const text = msgEvent.message?.text;
          const mid = msgEvent.message?.mid;
          const attachments = msgEvent.message?.attachments;

          if (senderId && (text || attachments)) {
            let mediaUrl: string | undefined;
            let mediaType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' = 'TEXT';

            if (attachments && attachments.length > 0) {
              const firstAtt = attachments[0];
              mediaUrl = firstAtt?.payload?.url;
              const attType = firstAtt?.type?.toLowerCase();

              if (attType === 'audio' || mediaUrl?.match(/\.(ogg|mp3|wav|m4a|aac|opus)/i)) {
                mediaType = 'AUDIO';
              } else if (attType === 'image') {
                mediaType = 'IMAGE';
              } else if (attType === 'video') {
                mediaType = 'VIDEO';
              }
            }

            messages.push({
              channel: 'FACEBOOK',
              channelId: String(senderId),
              messageId: mid || `fb_${Date.now()}`,
              content: text || (mediaType === 'AUDIO' ? '[Voice Message]' : mediaUrl ? '[Media Sent]' : ''),
              mediaUrl,
              mediaType,
              timestamp: msgEvent.timestamp || Date.now(),
            });
          }
        }
      }
    }
  }

  // Case 3: WhatsApp Cloud API Webhook
  if (payload.object === 'whatsapp_business_account' && Array.isArray(payload.entry)) {
    for (const entry of payload.entry) {
      if (Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          const val = change.value;
          if (val && Array.isArray(val.messages)) {
            const contactName = val.contacts?.[0]?.profile?.name;
            for (const waMsg of val.messages) {
              const fromNumber = waMsg.from;
              const textBody = waMsg.text?.body;
              const waId = waMsg.id;

              if (fromNumber && (textBody || waMsg.type !== 'text')) {
                let mediaUrl: string | undefined;
                let mediaType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' = 'TEXT';

                if (waMsg.type === 'audio' || waMsg.type === 'voice') {
                  mediaType = 'AUDIO';
                  mediaUrl =
                    waMsg.audio?.link ||
                    waMsg.voice?.link ||
                    (waMsg.audio?.id
                      ? `https://graph.facebook.com/v21.0/${waMsg.audio.id}`
                      : undefined);
                } else if (waMsg.type === 'image') {
                  mediaType = 'IMAGE';
                  mediaUrl =
                    waMsg.image?.link ||
                    (waMsg.image?.id
                      ? `https://graph.facebook.com/v21.0/${waMsg.image.id}`
                      : undefined);
                }

                messages.push({
                  channel: 'WHATSAPP',
                  channelId: String(fromNumber),
                  messageId: waId || `wa_${Date.now()}`,
                  content:
                    textBody ||
                    (mediaType === 'AUDIO' ? '[Voice Message]' : `[${waMsg.type || 'Media'} Sent]`),
                  senderName: contactName,
                  mediaUrl,
                  mediaType,
                  timestamp: Number(waMsg.timestamp) * 1000 || Date.now(),
                });
              }
            }
          }
        }
      }
    }
  }

  return messages;
};

const processIncomingWebhook = async (payload: IMetaWebhookPayload) => {
  const messages = extractMessagesFromPayload(payload);

  if (messages.length === 0) {
    return { queued: 0, message: 'No actionable messages extracted' };
  }

  const jobPromises = messages.map((msg) =>
    chatMessageQueue.add(
      'process-chat-message',
      msg,
      {
        jobId: `${msg.channel}_${msg.messageId}`, // Deduplication key!
      },
    ),
  );

  await Promise.all(jobPromises);

  return {
    queued: messages.length,
    message: `Successfully enqueued ${messages.length} message(s) to BullMQ`,
  };
};

export const WebhookServices = {
  verifyWebhook,
  extractMessagesFromPayload,
  processIncomingWebhook,
};

