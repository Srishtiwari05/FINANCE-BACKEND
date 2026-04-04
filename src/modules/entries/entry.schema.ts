import { z } from 'zod';

export const createEntrySchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .multipleOf(0.01, 'Amount can have at most 2 decimal places'),
  type: z.enum(['income', 'expense', 'transfer'], {
    required_error: 'Type is required',
    invalid_type_error: 'Type must be income, expense, or transfer',
  }),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category is required')
    .max(100, 'Category cannot exceed 100 characters')
    .trim(),
  date: z
    .string({ required_error: 'Date is required' })
    .datetime({ offset: true, message: 'Date must be a valid ISO 8601 date string' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'))
    .transform((val) => new Date(val)),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').trim().optional(),
  tags: z.array(z.string().trim()).max(10, 'Cannot have more than 10 tags').optional().default([]),
});

export const updateEntrySchema = createEntrySchema.partial();

export const entryFilterSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type EntryFilterInput = z.infer<typeof entryFilterSchema>;
