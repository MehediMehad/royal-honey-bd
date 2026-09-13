import httpStatus from 'http-status';
import { redis } from './redis';
import ApiError from '../errors/ApiError';
import { logger } from './logger';

/**
 * Acquire an atomic lock for incoming webhook message.
 * Returns true if this is the first time seeing this messageId, false if duplicate.
 */
export const acquireMessageLock = async (
  messageId: string,
  ttlSeconds = 3600, // 1 hour deduplication window
): Promise<boolean> => {
  if (!messageId) return true;

  try {
    const key = `idempotency:msg:${messageId}`;
    const acquired = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    if (!acquired) {
      logger.warn(`🛡️ [Idempotency] Blocked duplicate message ingestion: ${messageId}`);
      return false;
    }
    return true;
  } catch (err: any) {
    logger.warn('⚠️ [Idempotency] Redis error during message lock acquisition:', err?.message || err);
    return true; // Fallback to allowing message if Redis is temporarily unreachable
  }
};

/**
 * Distributed lock to prevent double order placement from rapid clicks or duplicated messages.
 */
export const withOrderLock = async <T>(
  customerId: string,
  task: () => Promise<T>,
  ttlSeconds = 15,
): Promise<T> => {
  const lockKey = `idempotency:order:${customerId}`;

  try {
    const acquired = await redis.set(lockKey, 'LOCKED', 'EX', ttlSeconds, 'NX');
    if (!acquired) {
      logger.warn(`🛡️ [Idempotency] Concurrent order creation blocked for customer ${customerId}`);
      throw new ApiError(
        httpStatus.CONFLICT,
        'একটি অর্ডার ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।',
      );
    }
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    logger.warn('⚠️ [Idempotency] Redis error during order lock acquisition:', err?.message || err);
  }

  try {
    return await task();
  } finally {
    try {
      await redis.del(lockKey);
    } catch {
      // Non-blocking release
    }
  }
};

export const Idempotency = {
  acquireMessageLock,
  withOrderLock,
};

