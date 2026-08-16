import rateLimit from 'express-rate-limit';
import config from '../config/config';

/**
 * General-purpose limiter for all /api routes.
 * NOTE: this is an internal CRM safety rule, not a WhatsApp/Meta platform
 * limit — see WhatsAppSafetyService (Phase 6) for the distinction.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.rateLimit.generalPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

/** Stricter limiter for auth endpoints (login/refresh) to blunt brute force. */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.rateLimit.authPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again shortly.' },
});
