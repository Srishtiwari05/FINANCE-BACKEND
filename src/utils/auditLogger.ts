import { Request } from 'express';
import { Types } from 'mongoose';
import { AuditLog, AuditAction } from '../models/auditLog.model';

export const createAuditLog = async (
  userId: Types.ObjectId,
  action: AuditAction,
  entityType: string,
  req: Request,
  options?: {
    entityId?: string;
    changes?: Record<string, unknown>;
  }
): Promise<void> => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId: options?.entityId,
      changes: options?.changes,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    });
  } catch (err) {
    // Audit log failure must NOT break the main request flow
    console.error('[AuditLog] Failed to write audit log:', err);
  }
};
