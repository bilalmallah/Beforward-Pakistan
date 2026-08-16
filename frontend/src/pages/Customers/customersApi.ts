import api from '../../lib/api';
import type { CustomerStatus, LeadSource } from '../../constants/customer';

export interface CustomerListItem {
  id: string;
  companyName: string;
  contactName: string | null;
  country: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  status: CustomerStatus;
  source: LeadSource;
  tags: string[];
  assignedSeller: { id: string; fullName: string; email: string } | null;
  assignedTeam: { id: string; name: string } | null;
  createdAt: string;
}

export interface CustomerNote {
  id: string;
  body: string;
  author: { id: string; fullName: string };
  createdAt: string;
}

export interface AssignmentHistoryEntry {
  id: string;
  method: string;
  reason: string | null;
  createdAt: string;
}

export interface CustomerDetail extends CustomerListItem {
  email: string | null;
  website: string | null;
  city: string | null;
  marketingOptIn: boolean;
  optedOut: boolean;
  callPermissionStatus: string;
  notes: CustomerNote[];
  assignmentHistory: AssignmentHistoryEntry[];
  creator: { id: string; fullName: string } | null;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ListCustomersParams {
  search?: string;
  status?: CustomerStatus;
  country?: string;
  source?: LeadSource;
  page?: number;
}

export async function listCustomers(params: ListCustomersParams = {}) {
  const { data } = await api.get<Paginated<CustomerListItem>>('/customers', { params });
  return data;
}

export async function getCustomer(id: string) {
  const { data } = await api.get<CustomerDetail>(`/customers/${id}`);
  return data;
}

export interface CreateCustomerInput {
  companyName: string;
  contactName?: string;
  country?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  source: LeadSource;
}

export async function createCustomer(input: CreateCustomerInput) {
  const { data } = await api.post<CustomerDetail>('/customers', input);
  return data;
}

export async function addCustomerNote(id: string, body: string) {
  const { data } = await api.post<CustomerNote>(`/customers/${id}/notes`, { body });
  return data;
}

export async function assignCustomer(
  id: string,
  input: { method: 'MANUAL' | 'ROUND_ROBIN' | 'TEAM_BASED' | 'COUNTRY_BASED' | 'WORKLOAD_BASED'; sellerId?: string; reason?: string }
) {
  const { data } = await api.post<CustomerDetail>(`/customers/${id}/assign`, input);
  return data;
}

export async function setMarketingConsent(id: string, optIn: boolean, optInSource?: string) {
  const { data } = await api.post<CustomerDetail>(`/customers/${id}/marketing-consent`, {
    optIn,
    optInSource,
  });
  return data;
}

export async function requestCallPermission(id: string) {
  const { data } = await api.post<CustomerDetail>(`/customers/${id}/call-permission/request`);
  return data;
}
