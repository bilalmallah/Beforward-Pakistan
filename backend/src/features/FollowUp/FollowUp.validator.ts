import { z } from 'zod';
import { FollowUpStatus } from './FollowUp.model.js';

export const createFollowUpSchema = z.object({
  customerId: z.string().uuid(),
  conversationId: z.string().uuid().nullable().optional(),
  reminderDate: z.coerce.date(),
  note: z.string().nullable().optional(),
});

export const updateFollowUpSchema = z.object({
  reminderDate: z.coerce.date().optional(),
  note: z.string().nullable().optional(),
  status: z.nativeEnum(FollowUpStatus).optional(),
});

export const listFollowUpsQuerySchema = z.object({
  status: z.nativeEnum(FollowUpStatus).optional(),
  today: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
export type ListFollowUpsQuery = z.infer<typeof listFollowUpsQuerySchema>;
