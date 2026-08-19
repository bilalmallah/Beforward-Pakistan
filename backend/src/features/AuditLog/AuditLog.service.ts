import { Request } from 'express';
import AuditLog from './AuditLog.model';
import logger from '../../utils/logger';

interface AuditEntry {
  req: Request;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Records an audit entry (spec section 41: userId, action, entity,
 * entityId, metadata, IP, timestamp). Deliberately fire-and-forget from
 * the caller's perspective — a failure to write an audit row should never
 * fail the underlying business action, just get logged.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create({
      userId: entry.req.user?.id ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
      ip: entry.req.ip ?? null,
    });
  } catch (err) {
    logger.error('Failed to write audit log entry', { action: entry.action, entity: entry.entity, err });
  }
}
