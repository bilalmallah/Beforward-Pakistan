import { NextFunction, Request, Response } from 'express';
import { ValidationError as SequelizeValidationError, UniqueConstraintError } from 'sequelize';
import { isHttpError } from 'http-errors';
import { ZodError } from 'zod';
import config from '../config/config';
import logger from '../utils/logger';

/**
 * Centralized error handler. Distinguishes known error types (Sequelize
 * validation/unique-constraint, Zod validation, JWT, http-errors) and
 * falls back to a generic 500 that never leaks internals in production.
 */
export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const correlationId = req.headers['x-request-id'] || undefined;

  logger.error('Request error', {
    correlationId,
    path: req.path,
    method: req.method,
    err,
  });

  if (err instanceof UniqueConstraintError) {
    res.status(409).json({
      error: 'A record with this value already exists.',
      fields: Object.keys(err.fields || {}),
    });
    return;
  }

  if (err instanceof SequelizeValidationError) {
    res.status(400).json({
      error: 'Validation failed.',
      details: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed.',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name: string }).name;
    if (name === 'JsonWebTokenError' || name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }
  }

  if (isHttpError(err)) {
    res.status(err.status).json({ error: err.expose ? err.message : 'Request failed.' });
    return;
  }

  const status = 500;
  const message =
    config.env === 'production' ? 'Something went wrong. Please try again.' : String(err);
  res.status(status).json({ error: message });
}
