import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import { UserRole } from '../features/User/User.model';

/**
 * Restricts a route to the given roles. Always runs after authMiddleware.
 * This is the server-side enforcement point — the frontend may also hide
 * UI for roles that lack permission, but that is never sufficient on its
 * own (per Teal Standard / CRM spec section 17, 46, 58).
 */
export default function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError(401, 'Authentication required.'));
      return;
    }
    if (!allowed.includes(req.user.role)) {
      next(createError(403, 'You do not have permission to perform this action.'));
      return;
    }
    next();
  };
}
