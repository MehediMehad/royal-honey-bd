import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { KnowledgeRoutes } from '../app/modules/knowledge/knowledge.route';
import { ProductRoutes } from '../app/modules/products/product.route';
import { OrderRoutes } from '../app/modules/order/order.route';
import { CourierRoutes } from '../app/modules/courier/courier.route';
import { WebhookRoutes } from '../app/modules/webhook/webhook.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
