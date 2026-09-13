import { AdminRoleEnum } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { KnowledgeControllers } from './knowledge.controller';
import { KnowledgeValidations } from './knowledge.validation';

const router = express.Router();

router.get(
  '/',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  KnowledgeControllers.getAllKnowledgeItems,
);

router.post(
  '/search',
  validateRequest(KnowledgeValidations.searchKnowledgeSchema),
  KnowledgeControllers.searchKnowledge,
);

router.get(
  '/:id',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  KnowledgeControllers.getKnowledgeItemById,
);

router.post(
  '/',
  auth(AdminRoleEnum.OWNER),
  validateRequest(KnowledgeValidations.createKnowledgeSchema),
  KnowledgeControllers.createKnowledgeItem,
);

router.patch(
  '/:id',
  auth(AdminRoleEnum.OWNER),
  validateRequest(KnowledgeValidations.updateKnowledgeSchema),
  KnowledgeControllers.updateKnowledgeItem,
);

router.delete(
  '/:id',
  auth(AdminRoleEnum.OWNER),
  KnowledgeControllers.deleteKnowledgeItem,
);

export const KnowledgeRoutes = router;
