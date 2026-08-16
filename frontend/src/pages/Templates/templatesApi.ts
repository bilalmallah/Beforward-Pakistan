import api from '../../lib/api';

export type TemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  language: string;
  status: TemplateStatus;
  body: string;
  footer: string | null;
  variables: string[];
  createdAt: string;
}

export async function listTemplates(status?: TemplateStatus) {
  const { data } = await api.get<TemplateItem[]>('/whatsapp/templates', { params: { status } });
  return data;
}

export interface CreateTemplateInput {
  name: string;
  category: string;
  language?: string;
  body: string;
  footer?: string;
  variables?: string[];
}

export async function createTemplate(input: CreateTemplateInput) {
  const { data } = await api.post<TemplateItem>('/whatsapp/templates', input);
  return data;
}

export async function updateTemplateStatus(id: string, status: TemplateStatus, rejectedReason?: string) {
  const { data } = await api.patch<TemplateItem>(`/whatsapp/templates/${id}/status`, {
    status,
    rejectedReason,
  });
  return data;
}
