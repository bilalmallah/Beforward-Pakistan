import { Request, Response } from 'express';
import createError from 'http-errors';
import asyncHandler from '../../utils/asyncHandler';
import Ticket, { TicketStatus } from './Ticket.model';
import Customer from '../Customer/Customer.model';
import User, { UserRole } from '../User/User.model';
import { createTicketSchema, updateTicketSchema, listTicketsQuerySchema } from './Ticket.validator';
import { notify } from '../Notification/Notification.service';
import { NotificationType } from '../Notification/Notification.model';

export const listTicketsHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = listTicketsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid query.');
  const { status, priority, category, customerId, page, pageSize } = parsed.data;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (customerId) where.customerId = customerId;

  const requester = req.user!;
  if (requester.role === UserRole.SALESPERSON) {
    where.assignedSellerId = requester.id;
  } else if (requester.role === UserRole.MANAGER) {
    where.assignedTeamId = requester.teamId;
  }

  const { rows, count } = await Ticket.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'companyName'] },
      { model: User, as: 'assignedSeller', attributes: ['id', 'fullName'] },
    ],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [
      ['priority', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });

  res.status(200).json({
    data: rows,
    pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
  });
});

export const getTicketHandler = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await Ticket.findByPk(req.params.id, {
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'companyName'] },
      { model: User, as: 'assignedSeller', attributes: ['id', 'fullName'] },
    ],
  });
  if (!ticket) throw createError(404, 'Ticket not found.');
  res.status(200).json(ticket);
});

export const createTicketHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createTicketSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const customer = await Customer.findByPk(parsed.data.customerId);
  if (!customer) throw createError(404, 'Customer not found.');

  const ticket = await Ticket.create({
    customerId: parsed.data.customerId,
    conversationId: parsed.data.conversationId ?? null,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority,
    category: parsed.data.category,
    assignedSellerId: customer.assignedSellerId,
    assignedTeamId: customer.assignedTeamId,
    createdBy: req.user!.id,
  });

  if (ticket.assignedSellerId) {
    await notify({
      userId: ticket.assignedSellerId,
      type: NotificationType.TICKET_ASSIGNED,
      title: `Ticket assigned: ${ticket.title}`,
      entityType: 'Ticket',
      entityId: ticket.id,
    });
  }

  res.status(201).json(ticket);
});

export const updateTicketHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateTicketSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) throw createError(404, 'Ticket not found.');

  const resolvedAt =
    parsed.data.status === TicketStatus.RESOLVED || parsed.data.status === TicketStatus.CLOSED
      ? new Date()
      : ticket.resolvedAt;

  await ticket.update({ ...parsed.data, resolvedAt });
  res.status(200).json(ticket);
});
