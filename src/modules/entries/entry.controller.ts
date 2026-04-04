import { Request, Response, NextFunction } from 'express';
import * as entryService from './entry.service';
import { successResponse, paginatedResponse } from '../../utils/apiResponse';
import { createAuditLog } from '../../utils/auditLogger';
import { Types } from 'mongoose';
import { EntryFilterInput } from './entry.schema';

const isAnalystOrAbove = (role: string) => role === 'analyst' || role === 'admin';
const isAdmin = (role: string) => role === 'admin';

export const createEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entry = await entryService.createEntry(req.body, req.user!.userId);
    await createAuditLog(new Types.ObjectId(req.user!.userId), 'ENTRY_CREATED', 'FinancialEntry', req, {
      entityId: entry._id.toString(),
      changes: req.body,
    });
    successResponse(res, { entry }, 'Entry created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const listEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entries, pagination } = await entryService.listEntries(
      req.query as unknown as EntryFilterInput,
      req.user!.userId,
      isAnalystOrAbove(req.user!.role)
    );
    paginatedResponse(res, entries, pagination, 'Entries retrieved');
  } catch (err) {
    next(err);
  }
};

export const getEntryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entry = await entryService.getEntryById(
      req.params['id']!,
      req.user!.userId,
      isAnalystOrAbove(req.user!.role)
    );
    successResponse(res, { entry }, 'Entry retrieved');
  } catch (err) {
    next(err);
  }
};

export const updateEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entry, oldData } = await entryService.updateEntry(
      req.params['id']!,
      req.body,
      req.user!.userId,
      isAdmin(req.user!.role)
    );
    await createAuditLog(new Types.ObjectId(req.user!.userId), 'ENTRY_UPDATED', 'FinancialEntry', req, {
      entityId: req.params['id'],
      changes: { before: oldData, after: req.body },
    });
    successResponse(res, { entry }, 'Entry updated');
  } catch (err) {
    next(err);
  }
};

export const deleteEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await entryService.softDeleteEntry(req.params['id']!);
    await createAuditLog(new Types.ObjectId(req.user!.userId), 'ENTRY_DELETED', 'FinancialEntry', req, {
      entityId: req.params['id'],
    });
    successResponse(res, null, 'Entry deleted successfully');
  } catch (err) {
    next(err);
  }
};
