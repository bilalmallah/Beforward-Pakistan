import api from '../../lib/api';
import { UserRole } from '../../constants/roles';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: string;
  teamId: string | null;
  phone: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function meRequest(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}
