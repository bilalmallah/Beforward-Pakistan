import { Request, Response } from 'express';
import createError from 'http-errors';
import asyncHandler from '../../utils/asyncHandler';
import { loginSchema, refreshSchema } from './Auth.validator';
import * as AuthService from './Auth.service';

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');
  }

  const result = await AuthService.login(parsed.data.email, parsed.data.password);
  res.status(200).json(result);
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');
  }

  const result = await AuthService.refresh(parsed.data.refreshToken);
  res.status(200).json(result);
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.me(req.user!.id);
  res.status(200).json(result);
});
