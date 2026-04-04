import { Response } from 'express';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message = 'Success'
): Response => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown[]
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

export const getPaginationParams = (query: Record<string, unknown>) => {
  const page = Math.max(1, parseInt(String(query['page'] || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query['limit'] || '10'), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
