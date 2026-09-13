import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { KnowledgeRoutes } from '../app/modules/knowledge/knowledge.route';
import { ProductRoutes } from '../app/modules/products/product.route';
import { OrderRoutes } from '../app/modules/order/order.route';
import { CourierRoutes } from '../app/modules/courier/courier.route';
import { ChatRoutes } from '../app/modules/chat/chat.route';
import { DashboardRoutes } from '../app/modules/admin/dashboard.route';
import { WebhookRoutes } from '../app/modules/webhook/webhook.route';
import { VoiceRoutes } from '../app/modules/voice/voice.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/admin',
    route: DashboardRoutes,
  },
  {
    path: '/chat',
    route: ChatRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
  {
    path: '/orders',
    route: OrderRoutes,
  },
  {
    path: '/courier',
    route: CourierRoutes,
  },
  {
    path: '/knowledge',
    route: KnowledgeRoutes,
  },
  {
    path: '/webhook',
    route: WebhookRoutes,
  },
  {
    path: '/voice',
    route: VoiceRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
