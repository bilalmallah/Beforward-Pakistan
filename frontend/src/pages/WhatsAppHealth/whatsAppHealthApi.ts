import api from '../../lib/api';

export interface WhatsAppHealthResponse {
  metaStatus: { status: 'HEALTHY' | 'NOT_CONFIGURED' | 'ERROR'; detail: string };
  internalHealth: {
    level: 'GOOD' | 'WARNING' | 'PAUSED';
    windowDays: number;
    sent: number;
    delivered: number;
    read: number;
    replies: number;
    optOuts: number;
    deliveryRate: number;
    readRate: number;
    replyRate: number;
    optOutRate: number;
  };
  templates: { approved: number; pending: number; rejected: number };
  recentErrors: { messageId: string; reason: string; createdAt: string }[];
}

export async function getWhatsAppHealth() {
  const { data } = await api.get<WhatsAppHealthResponse>('/whatsapp/health');
  return data;
}
