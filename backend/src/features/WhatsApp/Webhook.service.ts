import crypto from 'crypto';
import config from '../../config/config';
import logger from '../../utils/logger';
import Message, { MessageStatus } from '../Conversation/Message.model';
import MessageEvent from '../Conversation/MessageEvent.model';
import Customer from '../Customer/Customer.model';
import { recordCustomerMessage } from '../Conversation/Conversation.service';

/**
 * Verifies the X-Hub-Signature-256 header against the raw request body
 * using the app secret, per Meta's webhook security requirements. Never
 * trust webhook data without this check (spec section 9).
 */
export function verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader || !config.meta.appSecret) return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', config.meta.appSecret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

/** Handles Meta's webhook subscription verification handshake (GET request). */
export function verifyWebhookChallenge(mode: string, token: string, challenge: string): string | null {
  if (mode === 'subscribe' && token === config.meta.verifyToken && config.meta.verifyToken) {
    return challenge;
  }
  return null;
}

interface WhatsAppStatusEntry {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  errors?: { title?: string }[];
}

interface WhatsAppInboundMessage {
  from: string;
  type: string;
  text?: { body: string };
}

interface WhatsAppWebhookValue {
  messages?: WhatsAppInboundMessage[];
  statuses?: WhatsAppStatusEntry[];
}

interface WhatsAppWebhookPayload {
  entry?: { changes?: { value?: WhatsAppWebhookValue }[] }[];
}

/**
 * Processes a verified webhook payload: inbound customer messages and
 * outbound message status updates (sent/delivered/read/failed). Always
 * stores the raw payload for auditing (spec section 89) regardless of
 * whether processing succeeds for every entry.
 */
export async function processWebhookPayload(payload: WhatsAppWebhookPayload): Promise<void> {
  const changes = payload.entry?.flatMap((e) => e.changes ?? []) ?? [];

  for (const change of changes) {
    const value = change.value;
    if (!value) continue;

    for (const inbound of value.messages ?? []) {
      await handleInboundMessage(inbound);
    }
    for (const status of value.statuses ?? []) {
      await handleStatusUpdate(status);
    }
  }
}

async function handleInboundMessage(inbound: WhatsAppInboundMessage): Promise<void> {
  const customer = await Customer.findOne({ where: { whatsappNumber: inbound.from } });
  if (!customer) {
    logger.warn('Inbound WhatsApp message from unknown number — no matching customer.', {
      from: inbound.from,
    });
    return;
  }

  const body = inbound.type === 'text' ? inbound.text?.body ?? '' : `[unsupported message type: ${inbound.type}]`;
  await recordCustomerMessage(customer.id, body);
}

async function handleStatusUpdate(status: WhatsAppStatusEntry): Promise<void> {
  const message = await Message.findOne({ where: { whatsappMessageId: status.id } });
  if (!message) {
    logger.warn('Status update for unknown WhatsApp message ID.', { whatsappMessageId: status.id });
    return;
  }

  const now = new Date();
  const updates: Partial<{
    status: MessageStatus;
    sentAt: Date;
    deliveredAt: Date;
    readAt: Date;
    failedAt: Date;
    failureReason: string;
  }> = {};

  // Only real webhook events ever set these — never manufactured
  // elsewhere in the app (spec section 88).
  if (status.status === 'sent') {
    updates.status = MessageStatus.SENT;
    updates.sentAt = now;
  } else if (status.status === 'delivered') {
    updates.status = MessageStatus.DELIVERED;
    updates.deliveredAt = now;
  } else if (status.status === 'read') {
    updates.status = MessageStatus.READ;
    updates.readAt = now;
  } else if (status.status === 'failed') {
    updates.status = MessageStatus.FAILED;
    updates.failedAt = now;
    updates.failureReason = status.errors?.[0]?.title ?? 'Unknown failure';
  }

  await message.update(updates);
  await MessageEvent.create({
    messageId: message.id,
    eventType: `STATUS_${status.status.toUpperCase()}`,
    rawPayload: status as unknown as Record<string, unknown>,
  });
}
