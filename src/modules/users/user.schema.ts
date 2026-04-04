import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .optional(),
  currentPassword: z.string().min(1, 'Current password is required').optional(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase and a number'
    )
    .optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) return false;
    return true;
  },
  { message: 'Current password is required to set a new password', path: ['currentPassword'] }
);

export const updateRoleSchema = z.object({
  role: z.enum(['viewer', 'analyst', 'admin'], {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be viewer, analyst, or admin',
  }),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive (boolean) is required' }),
});

export const userListSchema = z.object({
  role: z.enum(['viewer', 'analyst', 'admin']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
