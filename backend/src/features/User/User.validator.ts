import { z } from 'zod';
import { UserRole, UserStatus } from './User.model';

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('A valid email is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.nativeEnum(UserRole),
  teamId: z.string().uuid().nullable().optional(),
  phone: z.string().min(5).nullable().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  teamId: z.string().uuid().nullable().optional(),
  phone: z.string().min(5).nullable().optional(),
});

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  teamId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
