import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Assigns a correlation ID to every request (spec section 60: structured
 * logging, request IDs). Respects an inbound X-Request-Id if the client/
 * proxy already set one, so IDs stay consistent across a reverse proxy
 * hop; otherwise generates one. Echoed back on the response so client-side
 * error reports can reference the exact request.
 */
export default function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
}
