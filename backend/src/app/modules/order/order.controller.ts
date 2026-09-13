import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import pick from '../../helpers/pick';
import sendResponse from '../../utils/sendResponse';
import { OrderServices } from './order.service';
import { InvoiceServices } from './invoice.service';

const createDirectOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.createAtomicOrder(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Order placed successfully',
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    'orderStatus',
    'paymentStatus',
    'paymentMethod',
    'searchTerm',
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);

  const result = await OrderServices.getAllOrders(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await OrderServices.getOrderById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const getInvoice = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const html = await InvoiceServices.generateInvoiceHtml(id);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

const verifyAdvancePayment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const adminUser = (req as any).user;
  const result = await OrderServices.verifyAdvancePayment(
    id,
    adminUser?.id || adminUser?.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Advance payment verified and order confirmed successfully',
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { orderStatus, notes } = req.body;
  const result = await OrderServices.updateOrderStatus(id, orderStatus, notes);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order status updated successfully',
    data: result,
  });
});

export const OrderControllers = {
  createDirectOrder,
  getAllOrders,
  getOrderById,
  getInvoice,
  verifyAdvancePayment,
  updateOrderStatus,
};

