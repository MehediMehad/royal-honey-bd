import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { WebhookServices } from './webhook.service';

const verifyWebhook = catchAsync(async (req: Request, res: Response) => {
  const challenge = WebhookServices.verifyWebhook(req.query);

  if (challenge) {
    res.status(httpStatus.OK).send(challenge);
    return;
  }

  res.status(httpStatus.FORBIDDEN).send('Forbidden: Invalid verification token');
});

const receiveWebhook = catchAsync(async (req: Request, res: Response) => {
  // Respond immediately with 200 OK so Meta/n8n never times out!
  const result = await WebhookServices.processIncomingWebhook(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: { queued: result.queued },
  });
});

export const WebhookControllers = {
  verifyWebhook,
  receiveWebhook,
};

