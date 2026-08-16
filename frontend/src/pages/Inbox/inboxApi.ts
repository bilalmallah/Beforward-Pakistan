import api from '../../lib/api';

export type ConversationStatus = 'NEW' | 'ACTIVE' | 'INACTIVE';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface ConversationListItem {
  id: string;
  status: ConversationStatus;
  unreadCount: number;
  lastCustomerMessageAt: string | null;
  lastBusinessMessageAt: string | null;
  customerServiceWindowExpiresAt: string | null;
  customer: { id: string; companyName: string; whatsappNumber: string | null; country: string | null };
  updatedAt: string;
}

export interface MessageItem {
  id: string;
  direction: MessageDirection;
  messageType: string;
  body: string | null;
  status: MessageStatus;
  createdAt: string;
}

export interface ConversationDetail extends ConversationListItem {
  messages: MessageItem[];
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listConversations(params: { status?: ConversationStatus; search?: string } = {}) {
  const { data } = await api.get<Paginated<ConversationListItem>>('/conversations', { params });
  return data;
}

export async function getConversation(id: string) {
  const { data } = await api.get<ConversationDetail>(`/conversations/${id}`);
  return data;
}

export async function sendMessage(conversationId: string, body: string) {
  const { data } = await api.post<MessageItem>(`/conversations/${conversationId}/messages`, { body });
  return data;
}

export async function sendTemplateMessage(conversationId: string, templateId: string, vehicleId?: string) {
  const { data } = await api.post<MessageItem>(`/conversations/${conversationId}/template-messages`, {
    templateId,
    vehicleId,
  });
  return data;
}

export async function markConversationRead(conversationId: string) {
  const { data } = await api.post(`/conversations/${conversationId}/read`);
  return data;
}
