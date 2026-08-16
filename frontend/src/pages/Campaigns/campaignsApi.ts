import api from '../../lib/api';

export type CampaignStatus =
  | 'DRAFT'
  | 'VALIDATING'
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED';

export interface CampaignItem {
  id: string;
  name: string;
  status: CampaignStatus;
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  createdAt: string;
}

export async function listCampaigns() {
  const { data } = await api.get<CampaignItem[]>('/campaigns');
  return data;
}

export interface CreateCampaignInput {
  name: string;
  templateId: string;
  vehicleId?: string;
  filters?: { country?: string; status?: string };
}

export async function createCampaign(input: CreateCampaignInput) {
  const { data } = await api.post<CampaignItem>('/campaigns', input);
  return data;
}

export async function startCampaign(id: string) {
  const { data } = await api.post<CampaignItem>(`/campaigns/${id}/start`);
  return data;
}

export async function pauseCampaign(id: string) {
  const { data } = await api.post<CampaignItem>(`/campaigns/${id}/pause`);
  return data;
}

export async function cancelCampaign(id: string) {
  const { data } = await api.post<CampaignItem>(`/campaigns/${id}/cancel`);
  return data;
}
