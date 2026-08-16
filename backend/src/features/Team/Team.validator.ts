import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name is required.'),
  region: z.string().min(2).nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).optional(),
  region: z.string().min(2).nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
