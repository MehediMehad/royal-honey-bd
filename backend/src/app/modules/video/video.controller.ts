import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VideoServices } from './video.service';

const analyzeVideo = catchAsync(async (req: Request, res: Response) => {
  const { videoUrl, thumbnailUrl, channel } = req.body;

  if (!videoUrl) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'videoUrl is required for video analysis',
    });
    return;
  }

  const result = await VideoServices.analyzeCustomerVideo({
    videoUrl,
    thumbnailUrl,
    channel,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isDamaged
      ? 'Video analyzed: Damage/leakage detected'
      : 'Video analyzed successfully',
    data: result,
  });
});

export const VideoControllers = {
  analyzeVideo,
};

