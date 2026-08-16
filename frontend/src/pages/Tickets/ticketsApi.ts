import api from '../../lib/api';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketCategory =
  | 'VEHICLE_INQUIRY'
  | 'QUOTATION'
  | 'PAYMENT'
  | 'SHIPPING'
  | 'DOCUMENTATION'
  | 'COMPLAINT'
  | 'TECHNICAL'
  | 'OTHER';

export interface TicketItem {
  id: string;
  title: string;
  description: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  customer: { id: string; companyName: string };
  assignedSeller: { id: string; fullName: string } | null;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listTickets(params: { status?: TicketStatus; priority?: TicketPriority } = {}) {
  const { data } = await api.get<Paginated<TicketItem>>('/tickets', { params });
  return data;
}

export interface CreateTicketInput {
  customerId: string;
  title: string;
  description?: string;
  priority: TicketPriority;
  category: TicketCategory;
}

export async function createTicket(input: CreateTicketInput) {
  const { data } = await api.post<TicketItem>('/tickets', input);
  return data;
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const { data } = await api.patch<TicketItem>(`/tickets/${id}`, { status });
  return data;
}
