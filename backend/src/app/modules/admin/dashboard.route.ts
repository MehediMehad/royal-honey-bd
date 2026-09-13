import { AdminRoleEnum } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import { DashboardControllers } from './dashboard.controller';

const router = express.Router();

router.get(
  '/dashboard-stats',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  DashboardControllers.getDashboardStats,
);

export const DashboardRoutes = router;

