import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import AuditLog from './AuditLog.model';
import User from '../User/User.model';

export const listAuditLogsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { entity, userId, page = '1', pageSize = '50' } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;

  const pageNum = Math.max(1, Number(page) || 1);
  const sizeNum = Math.min(100, Math.max(1, Number(pageSize) || 50));

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
    limit: sizeNum,
    offset: (pageNum - 1) * sizeNum,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    data: rows,
    pagination: { page: pageNum, pageSize: sizeNum, total: count, totalPages: Math.ceil(count / sizeNum) },
  });
});
