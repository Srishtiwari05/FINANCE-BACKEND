import { User, UserRole } from '../../models/user.model';
import { hashPassword, comparePassword } from '../../utils/password';
import { createError } from '../../middleware/error.middleware';
import { UpdateProfileInput } from './user.schema';
import { getPaginationParams } from '../../utils/apiResponse';

export const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw createError('User not found', 404);
  return user;
};

export const updateMe = async (userId: string, input: UpdateProfileInput) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw createError('User not found', 404);

  if (input.name) user.name = input.name;

  if (input.newPassword) {
    if (!input.currentPassword) throw createError('Current password is required', 400);
    const isMatch = await comparePassword(input.currentPassword, user.passwordHash);
    if (!isMatch) throw createError('Current password is incorrect', 400);
    user.passwordHash = await hashPassword(input.newPassword);
  }

  await user.save();
  return user.toJSON();
};

export const listUsers = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter: Record<string, unknown> = {};

  if (query['role']) filter['role'] = query['role'];
  if (query['isActive'] !== undefined) filter['isActive'] = query['isActive'] === 'true';
  if (query['search']) {
    filter['$or'] = [
      { name: { $regex: query['search'], $options: 'i' } },
      { email: { $regex: query['search'], $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id);
  if (!user) throw createError('User not found', 404);
  return user;
};

export const changeUserRole = async (targetId: string, requesterId: string, role: UserRole) => {
  if (targetId === requesterId) throw createError('You cannot change your own role', 400);
  const user = await User.findByIdAndUpdate(targetId, { role }, { new: true, runValidators: true });
  if (!user) throw createError('User not found', 404);
  return user;
};

export const changeUserStatus = async (targetId: string, requesterId: string, isActive: boolean) => {
  if (targetId === requesterId) throw createError('You cannot deactivate your own account', 400);
  const user = await User.findByIdAndUpdate(targetId, { isActive }, { new: true });
  if (!user) throw createError('User not found', 404);
  return user;
};
