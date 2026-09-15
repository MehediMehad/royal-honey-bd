import { AdminRoleEnum } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import { ChatControllers } from './chat.controller';

const router = express.Router();

router.get(
  '/conversations',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  ChatControllers.getAllConversations,
);

router.get(
  '/conversations/:id/messages',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  ChatControllers.getConversationMessages,
);

router.post(
  '/conversations/:id/takeover',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  ChatControllers.takeoverConversation,
);

router.post(
  '/conversations/:id/resume-ai',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  ChatControllers.resumeAi,
);

router.post(
  '/conversations/:id/reply',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  ChatControllers.sendAgentReply,
);

router.get(
  '/global-ai-status',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  ChatControllers.getGlobalAiStatus,
);

router.post(
  '/toggle-global-ai',
  auth(AdminRoleEnum.OWNER, AdminRoleEnum.SUPPORT_AGENT),
  ChatControllers.toggleGlobalAi,
);

export const ChatRoutes = router;

