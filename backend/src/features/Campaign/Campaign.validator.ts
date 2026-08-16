import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required.'),
  templateId: z.string().uuid(),
  vehicleId: z.string().uuid().nullable().optional(),
  // Same filters as Customer list — the recipient set is computed from
  // these at validation time, not passed as a raw customer ID list.
  filters: z
    .object({
      status: z.string().optional(),
      country: z.string().optional(),
      assignedTeamId: z.string().uuid().optional(),
      tag: z.string().optional(),
    })
    .optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
