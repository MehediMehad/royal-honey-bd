import axios from 'axios';
import config from '../../../configs';
import type { CustomerChannelEnum } from '@prisma/client';

const sendFacebookMessengerReply = async (
  recipientPsid: string,
  text: string,
) => {
  if (!config.meta.pageAccessToken) {
    console.log(`[Dev Simulation] Meta Messenger Send to ${recipientPsid}: ${text}`);
    return;
  }

  try {
    await axios.post(
      'https://graph.facebook.com/v19.0/me/messages',
      {
        recipient: { id: recipientPsid },
        message: { text },
      },
      {
        params: { access_token: config.meta.pageAccessToken },
      },
    );
    console.log(`✅ Sent Facebook message to ${recipientPsid}`);
  } catch (error: any) {
    console.error(
      '❌ Failed to send Facebook Messenger reply:',
      error?.response?.data || error?.message,
    );
  }
};

const sendWhatsAppReply = async (recipientPhone: string, text: string) => {
  if (!config.meta.whatsappToken || !config.meta.whatsappPhoneId) {
    console.log(`[Dev Simulation] WhatsApp Send to ${recipientPhone}: ${text}`);
    return;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${config.meta.whatsappPhoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${config.meta.whatsappToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(`✅ Sent WhatsApp message to ${recipientPhone}`);
  } catch (error: any) {
    console.error(
      '❌ Failed to send WhatsApp reply:',
      error?.response?.data || error?.message,
    );
  }
};

const sendN8nOutgoingCallback = async (
  channel: CustomerChannelEnum,
  channelId: string,
  text: string,
) => {
  if (!config.meta.n8nWebhookUrl) return;

  try {
    await axios.post(config.meta.n8nWebhookUrl, {
      channel,
      channelId,
      message: text,
      timestamp: new Date().toISOString(),
    });
    console.log(`✅ Dispatched message to n8n outgoing webhook for ${channelId}`);
  } catch (error: any) {
    console.error('❌ Failed to dispatch to n8n webhook:', error?.message);
  }
};

const dispatchReply = async (
  channel: CustomerChannelEnum,
  channelId: string,
  text: string,
) => {
  if (channel === 'FACEBOOK') {
    await sendFacebookMessengerReply(channelId, text);
  } else if (channel === 'WHATSAPP') {
    await sendWhatsAppReply(channelId, text);
  }

  // Also notify n8n if an outgoing webhook URL is provided
  await sendN8nOutgoingCallback(channel, channelId, text);
};

export const MessageSender = {
  dispatchReply,
  sendFacebookMessengerReply,
  sendWhatsAppReply,
};

