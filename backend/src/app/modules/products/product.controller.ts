import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import pick from '../../helpers/pick';
import sendResponse from '../../utils/sendResponse';
import { ProductServices } from './product.service';

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    'searchTerm',
    'isAvailable',
    'minPrice',
    'maxPrice',
  ]);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await ProductServices.getAllProducts(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ProductServices.getProductById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.createProduct(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Product created successfully',
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ProductServices.updateProduct(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product updated successfully',
    data: result,
  });
});

const restockProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const restockedBy = req.user?.email || req.user?.userId;
  const result = await ProductServices.restockProduct(id, req.body, restockedBy);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product restocked successfully',
    data: result,
  });
});

const getLowStockProducts = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await ProductServices.getLowStockProducts();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Low stock products retrieved successfully',
      data: result,
    });
  },
);

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ProductServices.deleteProduct(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product deleted successfully',
    data: result,
  });
});

export const ProductControllers = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  restockProduct,
  getLowStockProducts,
  deleteProduct,
};
