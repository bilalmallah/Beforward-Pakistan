import { z } from 'zod';
import { CustomerStatus, LeadSource, CallPermissionStatus } from './Customer.model';
import { AssignmentMethod } from './AssignmentHistory.model';

export const createCustomerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  contactName: z.string().min(1).nullable().optional(),
  country: z.string().min(1).nullable().optional(),
  city: z.string().min(1).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(3).nullable().optional(),
  whatsappNumber: z.string().min(3).nullable().optional(),
  website: z.string().url().nullable().optional(),
  source: z.nativeEnum(LeadSource).default(LeadSource.MANUAL_ENTRY),
  sourceReference: z.string().nullable().optional(),
  tags: z.array(z.string().min(1)).optional(),
});

export const updateCustomerSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactName: z.string().min(1).nullable().optional(),
  country: z.string().min(1).nullable().optional(),
  city: z.string().min(1).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(3).nullable().optional(),
  whatsappNumber: z.string().min(3).nullable().optional(),
  website: z.string().url().nullable().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  tags: z.array(z.string().min(1)).optional(),
  callPermissionStatus: z.nativeEnum(CallPermissionStatus).optional(),
});

// Marketing consent is intentionally its own endpoint/schema, never folded
// into the general update — spec section 18: CRM registration must not be
// treated as marketing opt-in, so this has to be a deliberate action with
// its own source.
export const setMarketingConsentSchema = z.object({
  optIn: z.boolean(),
  optInSource: z.string().min(1, 'A documented opt-in source is required.').optional(),
});

export const assignCustomerSchema = z.object({
  method: z.nativeEnum(AssignmentMethod),
  sellerId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  reason: z.string().max(255).optional(),
});

export const createNoteSchema = z.object({
  body: z.string().min(1, 'Note cannot be empty.'),
});

export const listCustomersQuerySchema = z.object({
  status: z.nativeEnum(CustomerStatus).optional(),
  country: z.string().optional(),
  assignedSellerId: z.string().uuid().optional(),
  assignedTeamId: z.string().uuid().optional(),
  source: z.nativeEnum(LeadSource).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type AssignCustomerInput = z.infer<typeof assignCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
