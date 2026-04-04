import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { errorResponse } from '../utils/apiResponse';
import { User } from '../models/user.model';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { _id: string };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      errorResponse(res, 'Authorization token is required', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      errorResponse(res, 'Authorization token is missing', 401);
      return;
    }

    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await User.findById(payload.userId).select('_id role isActive');
    if (!user) {
      errorResponse(res, 'User not found or account deleted', 401);
      return;
    }

    if (!user.isActive) {
      errorResponse(res, 'Account has been deactivated. Contact an administrator.', 403);
      return;
    }

    req.user = { userId: payload.userId, role: user.role, _id: user._id.toString() };
    next();
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === 'TokenExpiredError'
        ? 'Token has expired'
        : 'Invalid or malformed token';
    errorResponse(res, message, 401);
  }
};
