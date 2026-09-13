import { AdminRoleEnum } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import { CourierControllers } from './courier.controller';

const router = express.Router();

router.post(
  '/book/:orderId',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  CourierControllers.bookOrder,
);

router.get(
  '/fraud-check/:phone',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  CourierControllers.checkFraud,
);

router.get(
  '/track/:orderId',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  CourierControllers.trackOrder,
);

export const CourierRoutes = router;

