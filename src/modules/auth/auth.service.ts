import { User } from '../../models/user.model';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';
import { createError } from '../../middleware/error.middleware';

export const registerUser = async (input: RegisterInput) => {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw createError('Email is already registered', 409);

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: 'viewer', // default role
  });

  const tokens = generateTokenPair(user._id, user.role);

  // Store hashed refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, tokens };
};

export const loginUser = async (input: LoginInput) => {
  // Explicitly select passwordHash since it's hidden by default
  const user = await User.findOne({ email: input.email }).select('+passwordHash +refreshToken');
  if (!user) throw createError('Invalid email or password', 401);
  if (!user.isActive) throw createError('Account has been deactivated. Contact an administrator.', 403);

  const isMatch = await comparePassword(input.password, user.passwordHash);
  if (!isMatch) throw createError('Invalid email or password', 401);

  const tokens = generateTokenPair(user._id, user.role);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  // Remove sensitive fields before returning
  const userObj = user.toJSON();
  return { user: userObj, tokens };
};

export const refreshTokens = async (token: string) => {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw createError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(payload.userId).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw createError('Refresh token is invalid or has been revoked', 401);
  }

  const tokens = generateTokenPair(user._id, user.role);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return tokens;
};

export const logoutUser = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: '' } });
};
