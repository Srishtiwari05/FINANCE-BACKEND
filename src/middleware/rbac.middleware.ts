import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';
import { errorResponse } from '../utils/apiResponse';

// Role hierarchy: admin > analyst > viewer
const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

/**
 * Middleware factory: require at least the given role level.
 * Usage: router.get('/route', authenticate, requireRole('analyst'), handler)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role];
    const hasAccess = allowedRoles.some(
      (role) => userRoleLevel >= ROLE_HIERARCHY[role]
    );

    if (!hasAccess) {
      errorResponse(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        403
      );
      return;
    }

    next();
  };
};

/**
 * Middleware: require exactly the minimum role level (e.g. 'analyst' means analyst OR admin).
 */
export const requireMinRole = (minRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < requiredLevel) {
      errorResponse(
        res,
        `Access denied. Minimum required role: ${minRole}. Your role: ${req.user.role}`,
        403
      );
      return;
    }

    next();
  };
};
