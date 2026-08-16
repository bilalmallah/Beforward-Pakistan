import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import { verifyAccessToken } from '../utils/token';
import User, { UserStatus } from '../features/User/User.model';

/**
 * Verifies the bearer access token, loads the user, and rejects
 * inactive/suspended accounts. Populates req.user for downstream
 * RBAC checks (see rbac.ts).
 */
export default async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw createError(401, 'Authentication required.');
    }

    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);

    const user = await User.findByPk(payload.id);
    if (!user) {
      throw createError(401, 'Invalid session.');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw createError(403, 'This account is not active.');
    }

    req.user = { id: user.id, role: user.role, teamId: user.teamId };
    next();
  } catch (err) {
    if (createError.isHttpError(err)) {
      next(err);
    } else {
      next(createError(401, 'Invalid or expired token.'));
    }
  }
}
