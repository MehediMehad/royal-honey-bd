import { AdminRoleEnum } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import { AnalyticsControllers } from './analytics.controller';

const router = express.Router();

router.get(
  '/overview',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  AnalyticsControllers.getOverview,
);

router.get(
  '/dlq',
  auth(AdminRoleEnum.OWNER),
  AnalyticsControllers.getDlqMetrics,
);

router.post(
  '/dlq/retry/:jobId',
  auth(AdminRoleEnum.OWNER),
  AnalyticsControllers.retryDlqJob,
);

router.post(
  '/dlq/retry-all',
  auth(AdminRoleEnum.OWNER),
  AnalyticsControllers.retryAllDlqJobs,
);

router.delete(
  '/dlq/clean',
  auth(AdminRoleEnum.OWNER),
  AnalyticsControllers.cleanDlq,
);

router.get(
  '/abandoned-carts',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  AnalyticsControllers.getAbandonedCarts,
);

router.post(
  '/abandoned-carts/trigger',
  auth(AdminRoleEnum.OWNER),
  AnalyticsControllers.triggerAbandonedCartFollowup,
);

export const AnalyticsRoutes = router;

