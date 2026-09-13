import rateLimit from 'express-rate-limit';
import httpStatus from 'http-status';

/**
 * Standard API rate limiter (120 requests per minute per IP)
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after 1 minute.',
  },
});

/**
 * Webhook rate limiter (300 requests per minute to handle bursts of customer messages)
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: httpStatus.TOO_MANY_REQUESTS,
    message: 'Webhook rate limit exceeded. Please throttle incoming events.',
  },
});

/**
 * Sensitive Authentication / Login rate limiter (10 attempts per 15 minutes to prevent brute force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.',
  },
});

