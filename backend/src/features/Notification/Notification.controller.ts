import { Request, Response } from 'express';
import createError from 'http-errors';
import asyncHandler from '../../utils/asyncHandler.js';
import Notification from './Notification.model.js';

export const listNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === 'true';
  const where: Record<string, unknown> = { userId: req.user!.id };
  if (unreadOnly) where.isRead = false;

  const notifications = await Notification.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  const unreadCount = await Notification.count({ where: { userId: req.user!.id, isRead: false } });

  res.status(200).json({ data: notifications, unreadCount });
});

export const markReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification || notification.userId !== req.user!.id) {
    throw createError(404, 'Notification not found.');
  }
  await notification.update({ isRead: true });
  res.status(200).json(notification);
});

export const markAllReadHandler = asyncHandler(async (req: Request, res: Response) => {
  await Notification.update({ isRead: true }, { where: { userId: req.user!.id, isRead: false } });
  res.status(200).json({ success: true });
});
