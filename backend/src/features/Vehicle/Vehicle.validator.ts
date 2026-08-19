import { z } from 'zod';
import { VehicleStatus, Transmission, FuelType } from './Vehicle.model.js';

export const createVehicleSchema = z.object({
  stockId: z.string().min(1, 'Stock ID is required.'),
  make: z.string().min(1, 'Make is required.'),
  model: z.string().min(1, 'Model is required.'),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().int().min(0),
  transmission: z.nativeEnum(Transmission),
  fuel: z.nativeEnum(FuelType),
  price: z.coerce.number().positive(),
  currency: z.string().min(1).default('USD'),
  country: z.string().min(1).nullable().optional(),
  images: z.array(z.string().url()).max(10).optional(),
  description: z.string().nullable().optional(),
});

export const updateVehicleSchema = z.object({
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  fuel: z.nativeEnum(FuelType).optional(),
  price: z.coerce.number().positive().optional(),
  currency: z.string().min(1).optional(),
  country: z.string().min(1).nullable().optional(),
  images: z.array(z.string().url()).max(10).optional(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
});

export const listVehiclesQuerySchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  country: z.string().optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  fuel: z.nativeEnum(FuelType).optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;
