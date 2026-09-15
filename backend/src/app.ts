import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Application, Request, Response } from 'express';
import express from 'express';
import httpStatus from 'http-status';
import morgan from 'morgan';
import config from './configs';
import globalErrorHandler from './app/errors/globalErrorHandler';
import router from './routes';

import { apiLimiter } from './app/middlewares/rateLimiter';

const app: Application = express();

// Trust reverse proxies (ngrok, Nginx, Render, Cloudflare) for accurate client IP & rate limiting
app.set('trust proxy', 1);

// HTTP Logging
if (config.app.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: config.app.cors_origins,
    credentials: true,
  }),
);

// Body parser with rawBody capture for cryptographic signature verification (Meta Webhook HMAC)
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: '🍯 Royal Honey BD API is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// API Routes with rate limiting
app.use('/api/v1', apiLimiter, router);

// Global Error Handler
app.use(globalErrorHandler);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API Endpoint Not Found',
    error: {
      path: req.originalUrl,
      message: 'The requested endpoint does not exist.',
    },
  });
});

export default app;

