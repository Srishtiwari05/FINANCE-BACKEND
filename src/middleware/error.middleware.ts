import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log full error only in non-test environments
  if (env.nodeEnv !== 'test') {
    console.error(`[ERROR] ${statusCode} - ${message}`);
    if (statusCode >= 500) {
      console.error(err.stack);
    }
  }

  // Don't expose stack traces in production
  const isDev = env.nodeEnv === 'development';
  errorResponse(
    res,
    message,
    statusCode,
    isDev && err.stack ? [{ stack: err.stack }] : undefined
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, `Route ${req.method} ${req.path} not found`, 404);
};

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
