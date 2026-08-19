import { Request, Response } from 'express';
import createError from 'http-errors';
import asyncHandler from '../../utils/asyncHandler.js';
import Team from './Team.model.js';
import User from '../User/User.model.js';
import { createTeamSchema, updateTeamSchema } from './Team.validator.js';

export const listTeamsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const teams = await Team.findAll({
    include: [
      { model: User, as: 'manager', attributes: ['id', 'fullName', 'email'] },
      { model: User, as: 'members', attributes: ['id', 'fullName', 'role', 'status'] },
    ],
    order: [['name', 'ASC']],
  });
  res.status(200).json(teams);
});

export const getTeamHandler = asyncHandler(async (req: Request, res: Response) => {
  const team = await Team.findByPk(req.params.id, {
    include: [
      { model: User, as: 'manager', attributes: ['id', 'fullName', 'email'] },
      { model: User, as: 'members', attributes: ['id', 'fullName', 'role', 'status'] },
    ],
  });
  if (!team) throw createError(404, 'Team not found.');
  res.status(200).json(team);
});

export const createTeamHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createTeamSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');
  }

  const existing = await Team.findOne({ where: { name: parsed.data.name } });
  if (existing) throw createError(409, 'A team with this name already exists.');

  const team = await Team.create({
    name: parsed.data.name,
    region: parsed.data.region ?? null,
    managerId: parsed.data.managerId ?? null,
  });
  res.status(201).json(team);
});

export const updateTeamHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateTeamSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');
  }

  const team = await Team.findByPk(req.params.id);
  if (!team) throw createError(404, 'Team not found.');

  await team.update(parsed.data);
  res.status(200).json(team);
});

export const deleteTeamHandler = asyncHandler(async (req: Request, res: Response) => {
  const team = await Team.findByPk(req.params.id);
  if (!team) throw createError(404, 'Team not found.');

  const memberCount = await User.count({ where: { teamId: team.id } });
  if (memberCount > 0) {
    throw createError(409, 'Cannot delete a team that still has members assigned.');
  }

  await team.destroy();
  res.status(204).send();
});
