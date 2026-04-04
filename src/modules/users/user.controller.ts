import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';
import { successResponse, paginatedResponse } from '../../utils/apiResponse';
import { createAuditLog } from '../../utils/auditLogger';
import { Types } from 'mongoose';

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getMe(req.user!.userId);
    successResponse(res, { user }, 'Profile retrieved');
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.updateMe(req.user!.userId, req.body);
    await createAuditLog(new Types.ObjectId(req.user!.userId), 'USER_UPDATED', 'User', req, {
      entityId: req.user!.userId,
      changes: req.body,
    });
    successResponse(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { users, pagination } = await userService.listUsers(req.query as Record<string, unknown>);
    paginatedResponse(res, users, pagination, 'Users retrieved');
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params['id']!);
    successResponse(res, { user }, 'User retrieved');
  } catch (err) {
    next(err);
  }
};

export const changeRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.changeUserRole(
      req.params['id']!,
      req.user!.userId,
      req.body.role
    );
    await createAuditLog(new Types.ObjectId(req.user!.userId), 'USER_ROLE_CHANGED', 'User', req, {
      entityId: req.params['id'],
      changes: { role: req.body.role },
    });
    successResponse(res, { user }, 'User role updated');
  } catch (err) {
    next(err);
  }
};

export const changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.changeUserStatus(
      req.params['id']!,
      req.user!.userId,
      req.body.isActive
    );
    await createAuditLog(new Types.ObjectId(req.user!.userId), 'USER_STATUS_CHANGED', 'User', req, {
      entityId: req.params['id'],
      changes: { isActive: req.body.isActive },
    });
    successResponse(res, { user }, `User ${req.body.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};
