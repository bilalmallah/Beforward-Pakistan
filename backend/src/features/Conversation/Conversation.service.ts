import createError from 'http-errors';
import { Op } from 'sequelize';
import config from '../../config/config';
import Conversation, { ConversationStatus } from './Conversation.model';
import Message, { MessageDirection, MessageStatus, MessageType } from './Message.model';
import MessageEvent from './MessageEvent.model';
import Customer, { CallPermissionStatus } from '../Customer/Customer.model';
import { emitToUser } from '../../realtime/socket';
import * as WhatsAppService from '../WhatsApp/WhatsApp.service';
import Template, { TemplateStatus } from '../WhatsApp/Template.model';
import Vehicle from '../Vehicle/Vehicle.model';
import User from '../User/User.model';
import { resolveVariables, renderBody } from '../WhatsApp/TemplateVariable.service';

function windowExpiry(from: Date): Date {
  return new Date(from.getTime() + config.conversation.serviceWindowHours * 60 * 60 * 1000);
}

export async function getOrCreateConversation(customerId: string): Promise<Conversation> {
  const existing = await Conversation.findOne({ where: { customerId } });
  if (existing) return existing;

  const customer = await Customer.findByPk(customerId);
  if (!customer) throw createError(404, 'Customer not found.');

  return Conversation.create({
    customerId,
    assignedSellerId: customer.assignedSellerId,
    status: ConversationStatus.NEW,
    templateAttemptLimit: config.conversation.templateAttemptLimit,
  });
}

/**
 * Records a message coming FROM the customer. Sets the conversation ACTIVE
 * and (re)opens the customer-service window (spec section 24).
 *
 * NOTE — Phase 3 scope: until Phase 4 wires the real WhatsApp Cloud API
 * and webhook, there is no live channel for actual customer replies. This
 * is called from the dev-only "simulate inbound" endpoint (Super Admin
 * only, clearly labeled) so the inbox/state-machine can be built and
 * tested for real. It must be replaced by the real webhook handler in
 * Phase 4, not kept alongside it.
 */
export async function recordCustomerMessage(customerId: string, body: string): Promise<Message> {
  const conversation = await getOrCreateConversation(customerId);
  const now = new Date();

  // Call permission response parsing (spec section 20): while a request
  // is PENDING, interpret a YES/NO reply as the customer's answer. The
  // message is still recorded normally either way below — this only
  // reads the customer's own reply, never bypasses the permission
  // mechanism itself. Shared by both the real webhook and the dev-only
  // simulate-inbound endpoint, since both funnel through here.
  const customer = await Customer.findByPk(customerId);
  if (customer?.callPermissionStatus === CallPermissionStatus.PENDING) {
    const normalized = body.trim().toUpperCase();
    if (normalized === 'YES') {
      await customer.update({ callPermissionStatus: CallPermissionStatus.GRANTED });
    } else if (normalized === 'NO') {
      await customer.update({ callPermissionStatus: CallPermissionStatus.DENIED });
    }
  }

  const message = await Message.create({
    conversationId: conversation.id,
    customerId,
    direction: MessageDirection.INBOUND,
    messageType: MessageType.TEXT,
    body,
    status: MessageStatus.DELIVERED,
    deliveredAt: now,
  });

  await MessageEvent.create({
    messageId: message.id,
    eventType: 'INBOUND_RECEIVED',
    rawPayload: { source: 'internal-simulation', body },
  });

  await conversation.update({
    status: ConversationStatus.ACTIVE,
    lastCustomerMessageAt: now,
    customerServiceWindowExpiresAt: windowExpiry(now),
    unreadCount: conversation.unreadCount + 1,
  });

  if (conversation.assignedSellerId) {
    emitToUser(conversation.assignedSellerId, 'message:new', { conversationId: conversation.id, message });
    emitToUser(conversation.assignedSellerId, 'conversation:updated', { conversation });
  }

  return message;
}

/**
 * Records a message FROM the business (salesperson) TO the customer.
 * Enforces the customer-service window rule server-side (spec section 12,
 * 58) — free-form text is only allowed while the window is open; outside
 * it, only an approved template may be sent (template sending itself is
 * built in Phase 5, so `messageType` is required here as TEMPLATE with a
 * pre-approved body until that lands).
 */
export async function recordOutboundMessage(
  conversationId: string,
  sellerId: string,
  body: string,
  messageType: MessageType = MessageType.TEXT
): Promise<Message> {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw createError(404, 'Conversation not found.');

  if (messageType === MessageType.TEXT && !conversation.isWindowOpen()) {
    throw createError(
      403,
      'The customer-service window is closed. Free-form messaging is unavailable — an approved template is required.'
    );
  }

  const now = new Date();
  const message = await Message.create({
    conversationId: conversation.id,
    customerId: conversation.customerId,
    sellerId,
    direction: MessageDirection.OUTBOUND,
    messageType,
    body,
    status: MessageStatus.QUEUED,
  });

  // Attempt the real send once Meta credentials are configured. Until
  // then, the message stays QUEUED — never marked SENT/DELIVERED/READ
  // without a real API/webhook confirmation (spec section 88).
  const customer = await Customer.findByPk(conversation.customerId);
  if (customer?.whatsappNumber) {
    try {
      const result = await WhatsAppService.sendText(customer.whatsappNumber, body);
      await message.update({ status: MessageStatus.SENT, sentAt: now, whatsappMessageId: result.whatsappMessageId });
      await MessageEvent.create({
        messageId: message.id,
        eventType: 'OUTBOUND_SENT',
        rawPayload: result.raw as Record<string, unknown>,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error sending via WhatsApp Cloud API.';
      await MessageEvent.create({
        messageId: message.id,
        eventType: 'OUTBOUND_QUEUED',
        rawPayload: { reason },
      });
    }
  } else {
    await MessageEvent.create({
      messageId: message.id,
      eventType: 'OUTBOUND_QUEUED',
      rawPayload: { reason: 'Customer has no WhatsApp number on file.' },
    });
  }

  await conversation.update({ lastBusinessMessageAt: now });

  emitToUser(sellerId, 'message:new', { conversationId: conversation.id, message });

  return message;
}

export async function markConversationRead(conversationId: string): Promise<Conversation> {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw createError(404, 'Conversation not found.');
  await conversation.update({ unreadCount: 0 });
  return conversation;
}

/**
 * Recomputes INACTIVE status for conversations whose window has expired.
 * In production this should run on a schedule (Phase 9 observability /
 * background workers); exposed here as a plain function so it can be
 * called from a cron-style job later without redesigning the service.
 */
export async function sweepExpiredWindows(): Promise<number> {
  const [count] = await Conversation.update(
    { status: ConversationStatus.INACTIVE },
    {
      where: {
        status: ConversationStatus.ACTIVE,
        customerServiceWindowExpiresAt: { [Op.lt]: new Date() },
      },
    }
  );
  return count;
}

/**
 * Sends an approved template message. Unlike free-form text, this is
 * permitted regardless of the customer-service window (spec section 11) —
 * that's the entire purpose of templates. Only an APPROVED template may be
 * sent, and every declared variable must resolve or the send is rejected
 * before any API call (spec section 15, 17).
 */
export async function recordTemplateMessage(
  conversationId: string,
  sellerId: string,
  templateId: string,
  vehicleId: string | null
): Promise<Message> {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw createError(404, 'Conversation not found.');

  const template = await Template.findByPk(templateId);
  if (!template) throw createError(404, 'Template not found.');
  if (template.status !== TemplateStatus.APPROVED) {
    throw createError(422, `Template is not approved (current status: ${template.status}). Only approved templates may be sent.`);
  }

  if (conversation.templateSendingBlocked) {
    throw createError(
      429,
      'This customer has reached the configured template-attempt limit. Wait for a customer reply or ask a manager to review.'
    );
  }

  const customer = await Customer.findByPk(conversation.customerId);
  if (!customer) throw createError(404, 'Customer not found.');

  const seller = await User.findByPk(sellerId);
  const vehicle = vehicleId ? await Vehicle.findByPk(vehicleId) : null;
  if (vehicleId && !vehicle) throw createError(404, 'Selected vehicle not found.');

  const resolved = resolveVariables(template.variables, { customer, seller, vehicle });
  const renderedBody = renderBody(template.body, resolved);

  const now = new Date();
  const message = await Message.create({
    conversationId: conversation.id,
    customerId: conversation.customerId,
    sellerId,
    templateId: template.id,
    direction: MessageDirection.OUTBOUND,
    messageType: MessageType.TEMPLATE,
    body: renderedBody,
    status: MessageStatus.QUEUED,
  });

  if (customer.whatsappNumber) {
    try {
      // Meta template components follow a fixed structure per template —
      // this passes resolved body variables in declared order. Verify the
      // exact component/parameter shape against current Meta docs before
      // relying on it for a real send (spec section 90).
      const components = [
        {
          type: 'body',
          parameters: template.variables.map((name) => ({ type: 'text', text: resolved[name] })),
        },
      ];
      const result = await WhatsAppService.sendTemplate(
        customer.whatsappNumber,
        template.name,
        template.language,
        components
      );
      await message.update({ status: MessageStatus.SENT, sentAt: now, whatsappMessageId: result.whatsappMessageId });
      await MessageEvent.create({
        messageId: message.id,
        eventType: 'OUTBOUND_TEMPLATE_SENT',
        rawPayload: result.raw as Record<string, unknown>,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error sending template via WhatsApp Cloud API.';
      await MessageEvent.create({
        messageId: message.id,
        eventType: 'OUTBOUND_QUEUED',
        rawPayload: { reason },
      });
    }
  } else {
    await MessageEvent.create({
      messageId: message.id,
      eventType: 'OUTBOUND_QUEUED',
      rawPayload: { reason: 'Customer has no WhatsApp number on file.' },
    });
  }

  await conversation.update({ lastBusinessMessageAt: now });
  emitToUser(sellerId, 'message:new', { conversationId: conversation.id, message });

  // Internal safety counter (spec section 22) — increments on every
  // attempt, not just successful sends, since the point is to cap how
  // often we try an unresponsive contact.
  const newCount = conversation.templateAttemptCount + 1;
  await conversation.update({
    templateAttemptCount: newCount,
    templateSendingBlocked: newCount >= conversation.templateAttemptLimit,
  });

  return message;
}

/**
 * Manager review of a template-restricted conversation (spec section 23).
 * Raises the attempt limit by a configurable amount and unblocks sending.
 * Never described as a Meta-enforced rule — this is purely an internal
 * CRM safety mechanism the business controls.
 */
export async function overrideTemplateLimit(
  conversationId: string,
  additionalAttempts: number = config.conversation.managerOverrideAttempts
): Promise<Conversation> {
  const conversation = await Conversation.findByPk(conversationId);
  if (!conversation) throw createError(404, 'Conversation not found.');

  await conversation.update({
    templateAttemptLimit: conversation.templateAttemptLimit + additionalAttempts,
    templateSendingBlocked: false,
  });

  return conversation;
}
