import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'viewer' | 'analyst' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default in queries
    },
    role: {
      type: String,
      enum: ['viewer', 'analyst', 'admin'],
      default: 'viewer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret['passwordHash'];
        delete ret['refreshToken'];
        delete ret['__v'];
        return ret;
      },
    },
  }
);

// Compound index for admin user listing queries
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
