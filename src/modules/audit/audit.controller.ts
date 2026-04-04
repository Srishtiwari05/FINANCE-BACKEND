import { Request, Response, NextFunction } from 'express';
import * as auditService from './audit.service';
import { paginatedResponse } from '../../utils/apiResponse';

export const listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { logs, pagination } = await auditService.listAuditLogs(req.query as Record<string, unknown>);
    paginatedResponse(res, logs, pagination, 'Audit logs retrieved');
  } catch (err) {
    next(err);
  }
};
