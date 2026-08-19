import { Request, Response } from 'express';
import createError from 'http-errors';
import { Op } from 'sequelize';
import asyncHandler from '../../utils/asyncHandler';
import User from './User.model';
import Team from '../Team/Team.model';
import { createUserSchema, updateUserSchema, listUsersQuerySchema } from './User.validator';
import { recordAudit } from '../AuditLog/AuditLog.service';

export const listUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw createError(400, parsed.error.issues[0]?.message || 'Invalid query.');
  }
  const { role, status, teamId, search, page, pageSize } = parsed.data;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (teamId) where.teamId = teamId;
  if (search) {
    where[Op.or as unknown as string] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ model: Team, as: 'team', attributes: ['id', 'name'] }],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    data: rows,
    pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
  });
});

export const getUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByPk(req.params.id, {
    include: [{ model: Team, as: 'team', attributes: ['id', 'name'] }],
  });
  if (!user) throw createError(404, 'User not found.');
  res.status(200).json(user);
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');
  }

  const existing = await User.findOne({ where: { email: parsed.data.email } });
  if (existing) throw createError(409, 'A user with this email already exists.');

  const user = await User.create({
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    password: parsed.data.password,
    role: parsed.data.role,
    teamId: parsed.data.teamId ?? null,
    phone: parsed.data.phone ?? null,
  });

  res.status(201).json(user.toSafeJSON());
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');
  }

  const user = await User.findByPk(req.params.id);
  if (!user) throw createError(404, 'User not found.');

  await user.update(parsed.data);

  await recordAudit({
    req,
    action: 'USER_UPDATED',
    entity: 'User',
    entityId: user.id,
    metadata: { changes: parsed.data },
  });

  res.status(200).json(user.toSafeJSON());
});

export const deactivateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw createError(404, 'User not found.');

  await user.update({ status: 'INACTIVE' as User['status'] });
  res.status(200).json(user.toSafeJSON());
});
