import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { WebhookServices } from './webhook.service';

const verifyWebhook = catchAsync(async (req: Request, res: Response) => {
  console.log('🌐 ========================================================');
  console.log('🔍 [WEBHOOK GET HIT] Incoming Meta Verification Request:');
  console.log(JSON.stringify(req.query, null, 2));
  console.log('🌐 ========================================================');

  const challenge = WebhookServices.verifyWebhook(req.query);

  if (challenge) {
    console.log(`✅ [WEBHOOK GET] Returning challenge: ${challenge}`);
    res.status(httpStatus.OK).send(challenge);
    return;
  }

  console.warn('❌ [WEBHOOK GET] Verification failed for query above');
  res.status(httpStatus.FORBIDDEN).send('Forbidden: Invalid verification token');
});

const receiveWebhook = catchAsync(async (req: Request, res: Response) => {
  console.log('📬 ========================================================');
  console.log('⚡ [WEBHOOK POST HIT] Incoming Webhook Event Body:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('📬 ========================================================');

  // Respond immediately with 200 OK so Meta/n8n never times out!
  const result = await WebhookServices.processIncomingWebhook(req.body);

  console.log(`🎯 [WEBHOOK POST PROCESSED]: ${result.message} (Queued: ${result.queued})`);

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

