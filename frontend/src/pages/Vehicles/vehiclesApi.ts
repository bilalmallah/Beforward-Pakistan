import api from '../../lib/api';

export type VehicleStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'HIDDEN';
export type Transmission = 'MANUAL' | 'AUTOMATIC' | 'CVT';
export type FuelType = 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';

export interface VehicleItem {
  id: string;
  stockId: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: Transmission;
  fuel: FuelType;
  price: string;
  currency: string;
  country: string | null;
  status: VehicleStatus;
  images: string[];
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listVehicles(params: { search?: string; status?: VehicleStatus } = {}) {
  const { data } = await api.get<Paginated<VehicleItem>>('/vehicles', { params });
  return data;
}

export interface CreateVehicleInput {
  stockId: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: Transmission;
  fuel: FuelType;
  price: number;
  currency?: string;
  country?: string;
}

export async function createVehicle(input: CreateVehicleInput) {
  const { data } = await api.post<VehicleItem>('/vehicles', input);
  return data;
}
