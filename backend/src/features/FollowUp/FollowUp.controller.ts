import { Request, Response } from 'express';
import createError from 'http-errors';
import { Op } from 'sequelize';
import asyncHandler from '../../utils/asyncHandler';
import FollowUp from './FollowUp.model';
import Customer from '../Customer/Customer.model';
import { UserRole } from '../User/User.model';
import { createFollowUpSchema, updateFollowUpSchema, listFollowUpsQuerySchema } from './FollowUp.validator';

export const listFollowUpsHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = listFollowUpsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid query.');
  const { status, today, page, pageSize } = parsed.data;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (today) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    where.reminderDate = { [Op.between]: [startOfDay, endOfDay] };
  }

  // Every role sees only their own follow-ups — this is a personal daily
  // worklist (spec section 31 shows a "MY SALES" framing), not a team view.
  const requester = req.user!;
  if (requester.role === UserRole.SALESPERSON || requester.role === UserRole.MANAGER) {
    where.sellerId = requester.id;
  }

  const { rows, count } = await FollowUp.findAndCountAll({
    where,
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'companyName', 'phone', 'whatsappNumber'] }],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['reminderDate', 'ASC']],
  });

  res.status(200).json({
    data: rows,
    pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
  });
});

export const createFollowUpHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createFollowUpSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const customer = await Customer.findByPk(parsed.data.customerId);
  if (!customer) throw createError(404, 'Customer not found.');

  const followUp = await FollowUp.create({
    customerId: parsed.data.customerId,
    conversationId: parsed.data.conversationId ?? null,
    reminderDate: parsed.data.reminderDate,
    note: parsed.data.note ?? null,
    sellerId: req.user!.id,
  });

  res.status(201).json(followUp);
});

export const updateFollowUpHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateFollowUpSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const followUp = await FollowUp.findByPk(req.params.id);
  if (!followUp) throw createError(404, 'Follow-up not found.');

  if (followUp.sellerId !== req.user!.id) {
    throw createError(403, 'You can only update your own follow-ups.');
  }

  await followUp.update(parsed.data);
  res.status(200).json(followUp);
});
