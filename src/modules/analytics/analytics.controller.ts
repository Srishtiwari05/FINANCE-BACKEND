import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';
import { successResponse } from '../../utils/apiResponse';

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const summary = await analyticsService.getSummary({ from, to });
    successResponse(res, { summary }, 'Summary retrieved');
  } catch (err) {
    next(err);
  }
};

export const getByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const data = await analyticsService.getByCategory({ from, to });
    successResponse(res, { breakdown: data }, 'Category breakdown retrieved');
  } catch (err) {
    next(err);
  }
};

export const getByPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from, to, period } = req.query as { from?: string; to?: string; period?: string };
    const data = await analyticsService.getByPeriod({ from, to, period });
    successResponse(res, { trends: data, period: period || 'monthly' }, 'Period trends retrieved');
  } catch (err) {
    next(err);
  }
};

export const getRecentEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(String(req.query['limit'] || '10'), 10);
    const data = await analyticsService.getRecentEntries(limit);
    successResponse(res, { entries: data }, 'Recent entries retrieved');
  } catch (err) {
    next(err);
  }
};
