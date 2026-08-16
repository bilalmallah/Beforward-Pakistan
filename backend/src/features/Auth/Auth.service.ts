import createError from 'http-errors';
import User, { UserStatus } from '../User/User.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/token';

export interface AuthResponse {
  user: ReturnType<User['toSafeJSON']>;
  accessToken: string;
  refreshToken: string;
}

function buildAuthResponse(user: User): AuthResponse {
  return {
    user: user.toSafeJSON(),
    accessToken: generateAccessToken({ id: user.id, role: user.role, teamId: user.teamId }),
    refreshToken: generateRefreshToken({ id: user.id }),
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) {
    throw createError(401, 'Invalid email or password.');
  }
  if (user.status !== UserStatus.ACTIVE) {
    throw createError(403, 'This account is not active. Contact an administrator.');
  }

  const valid = await user.validatePassword(password);
  if (!valid) {
    throw createError(401, 'Invalid email or password.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return buildAuthResponse(user);
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw createError(401, 'Invalid or expired refresh token.');
  }

  const user = await User.findByPk(payload.id);
  if (!user || user.status !== UserStatus.ACTIVE) {
    throw createError(401, 'Invalid session.');
  }

  return buildAuthResponse(user);
}

export async function me(userId: string): Promise<ReturnType<User['toSafeJSON']>> {
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError(404, 'User not found.');
  }
  return user.toSafeJSON();
}
