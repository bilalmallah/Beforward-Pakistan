import { z } from 'zod';
import { TicketPriority, TicketStatus, TicketCategory } from './Ticket.model.js';

export const createTicketSchema = z.object({
  customerId: z.string().uuid(),
  conversationId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().nullable().optional(),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  category: z.nativeEnum(TicketCategory),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  assignedSellerId: z.string().uuid().nullable().optional(),
});

export const listTicketsQuerySchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  customerId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
