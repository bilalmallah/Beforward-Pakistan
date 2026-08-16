import api from '../../lib/api';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export interface FollowUpItem {
  id: string;
  reminderDate: string;
  note: string | null;
  status: FollowUpStatus;
  customer: { id: string; companyName: string; phone: string | null; whatsappNumber: string | null };
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listFollowUps(params: { today?: boolean; status?: FollowUpStatus } = {}) {
  const { data } = await api.get<Paginated<FollowUpItem>>('/followups', { params });
  return data;
}

export async function updateFollowUpStatus(id: string, status: FollowUpStatus) {
  const { data } = await api.patch<FollowUpItem>(`/followups/${id}`, { status });
  return data;
}
