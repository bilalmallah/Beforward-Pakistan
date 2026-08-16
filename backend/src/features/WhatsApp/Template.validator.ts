import { z } from 'zod';
import { TemplateStatus } from './Template.model';

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required.'),
  // Category values follow Meta's current template categories — not
  // hard-coded as an enum here since Meta may change them (spec section 13).
  category: z.string().min(1, 'Category is required.'),
  language: z.string().min(2).default('en'),
  headerType: z.string().nullable().optional(),
  body: z.string().min(1, 'Template body is required.'),
  footer: z.string().nullable().optional(),
  buttons: z.array(z.record(z.string(), z.unknown())).optional(),
  variables: z.array(z.string()).optional(),
  mediaRequirements: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const updateTemplateStatusSchema = z.object({
  status: z.nativeEnum(TemplateStatus),
  metaTemplateId: z.string().nullable().optional(),
  rejectedReason: z.string().nullable().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateStatusInput = z.infer<typeof updateTemplateStatusSchema>;
