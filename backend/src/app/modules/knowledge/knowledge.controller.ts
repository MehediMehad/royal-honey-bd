import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import pick from '../../helpers/pick';
import sendResponse from '../../utils/sendResponse';
import { KnowledgeServices } from './knowledge.service';

const createKnowledgeItem = catchAsync(async (req: Request, res: Response) => {
  const result = await KnowledgeServices.createKnowledgeItem(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Knowledge item created successfully',
    data: result,
  });
});

const updateKnowledgeItem = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await KnowledgeServices.updateKnowledgeItem(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Knowledge item updated successfully',
    data: result,
  });
});

const deleteKnowledgeItem = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await KnowledgeServices.deleteKnowledgeItem(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Knowledge item deleted successfully',
    data: result,
  });
});

const getKnowledgeItemById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await KnowledgeServices.getKnowledgeItemById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Knowledge item retrieved successfully',
    data: result,
  });
});

const getAllKnowledgeItems = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ['searchTerm', 'category', 'isActive']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const result = await KnowledgeServices.getAllKnowledgeItems(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Knowledge items retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const searchKnowledge = catchAsync(async (req: Request, res: Response) => {
  const result = await KnowledgeServices.searchKnowledge(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Knowledge search results retrieved successfully',
    data: result,
  });
});

export const KnowledgeControllers = {
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  getKnowledgeItemById,
  getAllKnowledgeItems,
  searchKnowledge,
};

