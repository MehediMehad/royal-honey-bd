import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CourierServices } from './courier.service';

const bookOrder = catchAsync(async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const result = await CourierServices.bookOrderParcel(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Parcel booked in courier successfully',
    data: result,
  });
});

const checkFraud = catchAsync(async (req: Request, res: Response) => {
  const phone = req.params.phone as string;
  const result = await CourierServices.checkCustomerFraud(phone);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer courier delivery success rate retrieved',
    data: result,
  });
});

const trackOrder = catchAsync(async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const result = await CourierServices.trackOrder(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Courier tracking status retrieved',
    data: result,
  });
});

export const CourierControllers = {
  bookOrder,
  checkFraud,
  trackOrder,
};

