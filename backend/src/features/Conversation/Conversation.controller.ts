import { Request, Response } from 'express';
import createError from 'http-errors';
import { Op } from 'sequelize';
import asyncHandler from '../../utils/asyncHandler';
import Conversation from './Conversation.model';
import Message from './Message.model';
import Customer from '../Customer/Customer.model';
import { UserRole } from '../User/User.model';
import {
  sendMessageSchema,
  simulateInboundSchema,
  sendTemplateMessageSchema,
  listConversationsQuerySchema,
} from './Conversation.validator';
import {
  recordOutboundMessage,
  recordCustomerMessage,
  recordTemplateMessage,
  overrideTemplateLimit,
  markConversationRead,
} from './Conversation.service';

export const listConversationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = listConversationsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid query.');
  const { status, search, page, pageSize } = parsed.data;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const requester = req.user!;
  if (requester.role === UserRole.SALESPERSON) {
    where.assignedSellerId = requester.id;
  }

  const customerWhere: Record<string, unknown> = {};
  if (search) {
    customerWhere[Op.or as unknown as string] = [
      { companyName: { [Op.iLike]: `%${search}%` } },
      { whatsappNumber: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Conversation.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: 'customer',
        where: Object.keys(customerWhere).length ? customerWhere : undefined,
        attributes: ['id', 'companyName', 'whatsappNumber', 'country'],
      },
    ],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['updatedAt', 'DESC']],
  });

  res.status(200).json({
    data: rows,
    pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
  });
});

export const getConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findByPk(req.params.id, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Message, as: 'messages', separate: true, order: [['createdAt', 'ASC']], limit: 200 },
    ],
  });
  if (!conversation) throw createError(404, 'Conversation not found.');

  const requester = req.user!;
  if (requester.role === UserRole.SALESPERSON && conversation.assignedSellerId !== requester.id) {
    throw createError(403, 'You do not have access to this conversation.');
  }

  res.status(200).json(conversation);
});

export const sendMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const message = await recordOutboundMessage(
    req.params.id,
    req.user!.id,
    parsed.data.body,
    parsed.data.messageType
  );

  res.status(201).json(message);
});

export const markReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await markConversationRead(req.params.id);
  res.status(200).json(conversation);
});

export const sendTemplateMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = sendTemplateMessageSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const message = await recordTemplateMessage(
    req.params.id,
    req.user!.id,
    parsed.data.templateId,
    parsed.data.vehicleId ?? null
  );

  res.status(201).json(message);
});

/**
 * Manager review of a template-restricted conversation (spec section 23).
 * Access is enforced at the route level (Manager/Admin/Super Admin only).
 */
export const overrideTemplateLimitHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await overrideTemplateLimit(req.params.id);
  res.status(200).json(conversation);
});

/**
 * Dev-only stand-in for a real inbound WhatsApp webhook. Restricted to
 * Super Admin so it can't be mistaken for (or misused as) a production
 * customer-facing endpoint. Must be removed once Phase 4's real webhook
 * handler is in place.
 */
export const simulateInboundHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = simulateInboundSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const message = await recordCustomerMessage(parsed.data.customerId, parsed.data.body);
  res.status(201).json(message);
});
