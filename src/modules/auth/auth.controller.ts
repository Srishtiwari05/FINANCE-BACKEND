import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { createAuditLog } from '../../utils/auditLogger';
import { Types } from 'mongoose';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await authService.registerUser(req.body);
    await createAuditLog(user._id as Types.ObjectId, 'USER_REGISTERED', 'User', req, {
      entityId: user._id.toString(),
    });
    successResponse(res, { user, tokens }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await authService.loginUser(req.body);
    const userId = String(user['_id']);
    await createAuditLog(
      new Types.ObjectId(userId),
      'USER_LOGIN',
      'User',
      req,
      { entityId: userId }
    );
    successResponse(res, { user, tokens }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    successResponse(res, { tokens }, 'Tokens refreshed successfully');
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logoutUser(req.user!.userId);
    await createAuditLog(
      new Types.ObjectId(req.user!.userId),
      'USER_LOGOUT',
      'User',
      req,
      { entityId: req.user!.userId }
    );
    successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};
