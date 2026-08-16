import { z } from 'zod';
import { MessageType } from './Message.model';

export const sendMessageSchema = z.object({
  body: z.string().min(1, 'Message cannot be empty.'),
  messageType: z.nativeEnum(MessageType).default(MessageType.TEXT),
});

// Dev-only utility for Phase 3 (see Conversation.service.ts note) — stands
// in for a real inbound WhatsApp webhook until Phase 4.
export const simulateInboundSchema = z.object({
  customerId: z.string().uuid(),
  body: z.string().min(1, 'Message cannot be empty.'),
});

export const sendTemplateMessageSchema = z.object({
  templateId: z.string().uuid(),
  vehicleId: z.string().uuid().nullable().optional(),
});

export const listConversationsQuerySchema = z.object({
  status: z.enum(['NEW', 'ACTIVE', 'INACTIVE']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SimulateInboundInput = z.infer<typeof simulateInboundSchema>;
export type SendTemplateMessageInput = z.infer<typeof sendTemplateMessageSchema>;
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
