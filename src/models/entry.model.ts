import mongoose, { Document, Schema, Types } from 'mongoose';

export type EntryType = 'income' | 'expense' | 'transfer';

export interface IFinancialEntry extends Document {
  title: string;
  amount: number;
  type: EntryType;
  category: string;
  date: Date;
  notes?: string;
  tags: string[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const financialEntrySchema = new Schema<IFinancialEntry>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense', 'transfer'],
        message: 'Type must be income, expense, or transfer',
      },
      required: [true, 'Type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret['__v'];
        return ret;
      },
    },
  }
);

// Compound indexes for common query patterns
financialEntrySchema.index({ createdBy: 1, isDeleted: 1 });
financialEntrySchema.index({ type: 1, isDeleted: 1 });
financialEntrySchema.index({ category: 1, isDeleted: 1 });
financialEntrySchema.index({ date: -1, isDeleted: 1 });
financialEntrySchema.index({ isDeleted: 1, date: -1 });

export const FinancialEntry = mongoose.model<IFinancialEntry>('FinancialEntry', financialEntrySchema);
