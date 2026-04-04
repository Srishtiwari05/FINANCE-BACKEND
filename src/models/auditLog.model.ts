import mongoose, { Document, Schema, Types } from 'mongoose';

export type AuditAction =
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_UPDATED'
  | 'USER_ROLE_CHANGED'
  | 'USER_STATUS_CHANGED'
  | 'ENTRY_CREATED'
  | 'ENTRY_UPDATED'
  | 'ENTRY_DELETED';

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'USER_REGISTERED',
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_UPDATED',
        'USER_ROLE_CHANGED',
        'USER_STATUS_CHANGED',
        'ENTRY_CREATED',
        'ENTRY_UPDATED',
        'ENTRY_DELETED',
      ],
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: String,
    changes: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret['__v'];
        return ret;
      },
    },
  }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
