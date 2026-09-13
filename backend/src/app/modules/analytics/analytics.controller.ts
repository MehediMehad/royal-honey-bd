import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AnalyticsServices } from './analytics.service';

const getOverview = catchAsync(async (req: Request, res: Response) => {
  const timeframe = (req.query.timeframe as '7d' | '30d' | '90d' | '1y') || '30d';
  const data = await AnalyticsServices.getOverviewAnalytics(timeframe);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Analytics overview retrieved successfully',
    data,
  });
});

const getDlqMetrics = catchAsync(async (_req: Request, res: Response) => {
  const data = await AnalyticsServices.getDlqMetrics();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'BullMQ DLQ metrics retrieved successfully',
    data,
  });
});

const retryDlqJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  const result = await AnalyticsServices.retryDlqJob(jobId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const retryAllDlqJobs = catchAsync(async (_req: Request, res: Response) => {
  const result = await AnalyticsServices.retryAllDlqJobs();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Retried ${result.retriedCount} failed jobs`,
    data: result,
  });
});

const cleanDlq = catchAsync(async (_req: Request, res: Response) => {
  const result = await AnalyticsServices.cleanDlqJobs();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const getAbandonedCarts = catchAsync(async (_req: Request, res: Response) => {
  const data = await AnalyticsServices.getAbandonedCarts();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Abandoned carts retrieved successfully',
    data,
  });
});

const triggerAbandonedCartFollowup = catchAsync(async (req: Request, res: Response) => {
  const { cartId } = req.body;
  const result = await AnalyticsServices.triggerAbandonedCartFollowup(cartId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const AnalyticsControllers = {
  getOverview,
  getDlqMetrics,
  retryDlqJob,
  retryAllDlqJobs,
  cleanDlq,
  getAbandonedCarts,
  triggerAbandonedCartFollowup,
};
