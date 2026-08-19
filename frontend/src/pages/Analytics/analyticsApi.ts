import api from '../../lib/api';

export interface DashboardSummary {
  totalCustomers: number;
  totalProspects: number;
  activeConversations: number;
  inactiveConversations: number;
  openTickets: number;
  salespeople: number;
  teams: number;
  todaysMessages: number;
  todaysReplies: number;
}

export async function getDashboardSummary() {
  const { data } = await api.get<DashboardSummary>('/analytics/dashboard');
  return data;
}

export interface SellerAnalytics {
  messagesSent: number;
  messagesReceived: number;
  activeConversations: number;
  leads: number;
  quotationsSent: number;
  deals: number;
  conversionRate: number;
  openFollowUps: number;
  openTickets: number;
}

export async function getMyAnalytics() {
  const { data } = await api.get<SellerAnalytics>('/analytics/me');
  return data;
}
