import { AdminRoleEnum } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { OrderControllers } from './order.controller';
import { OrderValidations } from './order.validation';

const router = express.Router();

router.get(
  '/',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  OrderControllers.getAllOrders,
);

router.get(
  '/:id',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  OrderControllers.getOrderById,
);

router.get('/:id/invoice', OrderControllers.getInvoice);

router.post(
  '/',
  validateRequest(OrderValidations.createOrderZodSchema),
  OrderControllers.createDirectOrder,
);

router.patch(
  '/:id/verify-payment',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  validateRequest(OrderValidations.verifyPaymentZodSchema),
  OrderControllers.verifyAdvancePayment,
);

router.patch(
  '/:id/status',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  validateRequest(OrderValidations.updateOrderStatusZodSchema),
  OrderControllers.updateOrderStatus,
);

export const OrderRoutes = router;

