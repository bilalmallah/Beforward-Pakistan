import api from '../../lib/api';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function listNotifications() {
  const { data } = await api.get<{ data: NotificationItem[]; unreadCount: number }>('/notifications');
  return data;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.post<NotificationItem>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/read-all');
}
