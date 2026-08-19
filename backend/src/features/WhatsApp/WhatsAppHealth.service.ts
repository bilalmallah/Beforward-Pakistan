import { Op } from 'sequelize';
import Message, { MessageStatus, MessageDirection } from '../Conversation/Message.model';
import Customer from '../Customer/Customer.model';
import Template, { TemplateStatus } from './Template.model';
import * as WhatsAppService from './WhatsApp.service';

export type MetaConnectionStatus = 'HEALTHY' | 'NOT_CONFIGURED' | 'ERROR';
export type InternalHealthLevel = 'GOOD' | 'WARNING' | 'PAUSED';

export interface MetaStatus {
  status: MetaConnectionStatus;
  detail: string;
}

/**
 * Reports the REAL Meta connection status by actually calling the Graph
 * API — never a hard-coded "healthy". Distinguishes "not configured yet"
 * from "configured but erroring", since those need different responses
 * from an operator (spec section 33, 51).
 */
export async function getMetaStatus(): Promise<MetaStatus> {
  try {
    await WhatsAppService.getPhoneNumber();
    return { status: 'HEALTHY', detail: 'Connected to the WhatsApp Cloud API.' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    if (message.includes('not configured yet')) {
      return { status: 'NOT_CONFIGURED', detail: message };
    }
    return { status: 'ERROR', detail: message };
  }
}

export interface InternalCampaignHealth {
  level: InternalHealthLevel;
  windowDays: number;
  sent: number;
  delivered: number;
  read: number;
  replies: number;
  optOuts: number;
  deliveryRate: number;
  readRate: number;
  replyRate: number;
  optOutRate: number;
}

/**
 * Internal analytics computed entirely from our own data — explicitly
 * NOT Meta's official quality/health algorithm (spec section 33-34). The
 * thresholds below are configurable business rules, not Meta policy.
 */
export async function calculateInternalHealth(windowDays = 30): Promise<InternalCampaignHealth> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [sent, delivered, read, replies, optOuts] = await Promise.all([
    Message.count({ where: { direction: MessageDirection.OUTBOUND, createdAt: { [Op.gte]: since } } }),
    Message.count({
      where: {
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.DELIVERED,
        createdAt: { [Op.gte]: since },
      },
    }),
    Message.count({
      where: { direction: MessageDirection.OUTBOUND, status: MessageStatus.READ, createdAt: { [Op.gte]: since } },
    }),
    Message.count({ where: { direction: MessageDirection.INBOUND, createdAt: { [Op.gte]: since } } }),
    Customer.count({ where: { optedOut: true, optedOutAt: { [Op.gte]: since } } }),
  ]);

  const rate = (n: number) => (sent > 0 ? Math.round((n / sent) * 1000) / 10 : 0);
  const optOutRate = rate(optOuts);

  // Thresholds are ours, configurable, and never described as a Meta rule
  // (spec section 62). Deliberately conservative defaults.
  let level: InternalHealthLevel = 'GOOD';
  if (optOutRate > 5) level = 'PAUSED';
  else if (optOutRate > 2) level = 'WARNING';

  return {
    level,
    windowDays,
    sent,
    delivered,
    read,
    replies,
    optOuts,
    deliveryRate: rate(delivered),
    readRate: rate(read),
    replyRate: rate(replies),
    optOutRate,
  };
}

export async function shouldPauseCampaigns(): Promise<boolean> {
  const health = await calculateInternalHealth();
  return health.level === 'PAUSED';
}

export interface TemplateSummary {
  approved: number;
  pending: number;
  rejected: number;
}

export async function getTemplateSummary(): Promise<TemplateSummary> {
  const [approved, pending, rejected] = await Promise.all([
    Template.count({ where: { status: TemplateStatus.APPROVED } }),
    Template.count({ where: { status: TemplateStatus.PENDING } }),
    Template.count({ where: { status: TemplateStatus.REJECTED } }),
  ]);
  return { approved, pending, rejected };
}

export interface RecentError {
  messageId: string;
  reason: string;
  createdAt: Date;
}

export async function getRecentErrors(limit = 10): Promise<RecentError[]> {
  const failed = await Message.findAll({
    where: { status: MessageStatus.FAILED },
    order: [['createdAt', 'DESC']],
    limit,
  });
  return failed.map((m) => ({
    messageId: m.id,
    reason: m.failureReason ?? 'Unknown failure.',
    createdAt: m.createdAt,
  }));
}
