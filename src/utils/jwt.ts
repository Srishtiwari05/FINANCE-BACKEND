import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Types } from 'mongoose';
import { UserRole } from '../models/user.model';

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const signRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwt.accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwt.refreshSecret) as TokenPayload;
};

export const generateTokenPair = (userId: Types.ObjectId, role: UserRole) => {
  const payload: TokenPayload = { userId: userId.toString(), role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};
