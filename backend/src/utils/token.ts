import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/config.js';
import { UserRole } from '../features/User/User.model.js';

export interface AccessTokenPayload {
  id: string;
  role: UserRole;
  teamId: string | null;
}

export interface RefreshTokenPayload {
  id: string;
  tokenVersion?: number;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as SignOptions);
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
}
