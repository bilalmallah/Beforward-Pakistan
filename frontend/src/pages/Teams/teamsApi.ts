import api from '../../lib/api';

export interface TeamRecord {
  id: string;
  name: string;
  region: string | null;
  manager: { id: string; fullName: string; email: string } | null;
  members: { id: string; fullName: string; role: string; status: string }[];
}

export async function listTeams() {
  const { data } = await api.get<TeamRecord[]>('/teams');
  return data;
}
