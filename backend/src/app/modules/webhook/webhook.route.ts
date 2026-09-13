import express from 'express';
import { WebhookControllers } from './webhook.controller';

const router = express.Router();

// Meta Webhook Verification GET
router.get('/', WebhookControllers.verifyWebhook);

// Webhook Ingestion POST (Facebook Messenger / WhatsApp / n8n)
router.post('/', WebhookControllers.receiveWebhook);

export const WebhookRoutes = router;

