import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VisionServices } from './vision.service';

const analyzeImage = catchAsync(async (req: Request, res: Response) => {
  const { imageUrl, base64Image, mimeType } = req.body;

  if (!imageUrl && !base64Image) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'imageUrl or base64Image is required for image analysis',
    });
    return;
  }

  const result = await VisionServices.analyzeCustomerImage({
    imageUrl,
    base64Image,
    mimeType,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Image classified as ${result.imageCategory}`,
    data: result,
  });
});

export const VisionControllers = {
  analyzeImage,
};

