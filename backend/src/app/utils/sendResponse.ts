import type { Response } from 'express';

type TMeta = {
  limit?: number;
  page?: number;
  total?: number;
  totalPage?: number;
};

type TResponse<T> = {
  statusCode: number;
  success?: boolean;
  message?: string;
  meta?: TMeta;
  data?: T;
};

export const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  res.status(data?.statusCode).json({
    success: data?.success !== undefined ? data.success : data?.statusCode < 400,
    statusCode: data?.statusCode,
    message: data.message,
    meta: data.meta,
    data: data.data,
  });
};

export default sendResponse;

