import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import pick from '../../helpers/pick';
import sendResponse from '../../utils/sendResponse';
import ApiError from '../../errors/ApiError';
import { ChatServices } from './chat.service';

const getAllConversations = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['status', 'channel', 'category', 'searchTerm']);
  const result = await ChatServices.getAllConversations(filters as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Conversations retrieved successfully',
    data: result,
  });
});

const getConversationMessages = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ChatServices.getConversationMessages(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Conversation messages retrieved successfully',
    data: result,
  });
});

const takeoverConversation = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const adminUser = (req as any).user;
  const result = await ChatServices.takeoverConversation(
    id,
    adminUser?.id || adminUser?.userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Conversation taken over by human agent successfully',
    data: result,
  });
});

const resumeAi = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ChatServices.resumeAi(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'AI automation resumed successfully',
    data: result,
  });
});

const sendAgentReply = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const content = req.body?.content || req.body?.text || req.body?.message;
  const adminUser = (req as any).user;

  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Message content is required');
  }

  const result = await ChatServices.sendAgentReply(
    id,
    content.trim(),
    adminUser?.id || adminUser?.userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Agent reply sent and dispatched to customer channel',
    data: result,
  });
});

export const ChatControllers = {
  getAllConversations,
  getConversationMessages,
  takeoverConversation,
  resumeAi,
  sendAgentReply,
};

