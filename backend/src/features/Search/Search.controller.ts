import { Request, Response } from 'express';
import createError from 'http-errors';
import asyncHandler from '../../utils/asyncHandler';
import { globalSearch } from './Search.service';

export const searchHandler = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  if (!q || q.length < 2) {
    throw createError(400, 'Search query must be at least 2 characters.');
  }

  const results = await globalSearch(q, {
    requesterId: req.user!.id,
    requesterRole: req.user!.role,
    requesterTeamId: req.user!.teamId,
  });

  res.status(200).json(results);
});
