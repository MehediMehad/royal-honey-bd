import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import config from '../../configs';
import { logger } from '../libs/logger';

export interface IRequestWithRawBody extends Request {
  rawBody?: Buffer;
}

/**
 * Verify Meta Webhook HMAC-SHA256 Signature (x-hub-signature-256)
 */
export const verifyMetaSignature = (
  req: IRequestWithRawBody,
  res: Response,
  next: NextFunction,
) => {
  const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;
  const appSecret = config.meta.appSecret || process.env.META_APP_SECRET;

  // In development, if secret is not set or dummy, allow with warning
  if (!appSecret || appSecret === 'dummy_meta_app_secret') {
    if (config.app.env === 'production') {
      logger.error('❌ [WebhookSecurity] META_APP_SECRET is not configured in production!');
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Server security misconfiguration',
      });
    }
    return next();
  }

  if (!signatureHeader) {
    logger.warn('⚠️ [WebhookSecurity] Missing x-hub-signature-256 header on incoming webhook request');
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Missing x-hub-signature-256 signature header',
    });
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    logger.warn(`⚠️ [WebhookSecurity] Invalid signature format: ${signatureHeader}`);
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid signature format. Expected sha256=<hash>',
    });
  }

  const signatureHash = parts[1];
  const payload = req.rawBody || Buffer.from(JSON.stringify(req.body));

  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signatureHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    logger.warn('❌ [WebhookSecurity] Webhook HMAC SHA-256 signature mismatch! Rejected unauthorized payload.');
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      message: 'Webhook signature validation failed',
    });
  }

  next();
};

