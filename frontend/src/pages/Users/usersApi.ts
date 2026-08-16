import api from '../../lib/api';
import { UserRole } from '../../constants/roles';

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  team: { id: string; name: string } | null;
  phone: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listUsers(params: { search?: string; page?: number } = {}) {
  const { data } = await api.get<Paginated<UserRecord>>('/users', { params });
  return data;
}
