import express from 'express';
import { WebhookControllers } from './webhook.controller';
import { verifyMetaSignature } from '../../middlewares/webhook.security';
import { webhookLimiter } from '../../middlewares/rateLimiter';

const router = express.Router();

// Meta Webhook Verification GET
router.get('/', WebhookControllers.verifyWebhook);

// Webhook Ingestion POST (Facebook Messenger / WhatsApp / n8n) with Rate Limiting and HMAC Signature Verification
router.post(
  '/',
  webhookLimiter,
  verifyMetaSignature,
  WebhookControllers.receiveWebhook,
);

export const WebhookRoutes = router;

