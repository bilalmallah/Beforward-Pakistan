import { Request, Response } from 'express';
import createError from 'http-errors';
import { Op } from 'sequelize';
import asyncHandler from '../../utils/asyncHandler.js';
import Vehicle from './Vehicle.model.js';
import { createVehicleSchema, updateVehicleSchema, listVehiclesQuerySchema } from './Vehicle.validator.js';

export const listVehiclesHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = listVehiclesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid query.');
  const { make, model, year, country, transmission, fuel, status, minPrice, maxPrice, search, page, pageSize } =
    parsed.data;

  const where: Record<string, unknown> = {};
  if (make) where.make = { [Op.iLike]: `%${make}%` };
  if (model) where.model = { [Op.iLike]: `%${model}%` };
  if (year) where.year = year;
  if (country) where.country = country;
  if (transmission) where.transmission = transmission;
  if (fuel) where.fuel = fuel;
  if (status) where.status = status;
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { [Op.gte]: minPrice } : {}),
      ...(maxPrice ? { [Op.lte]: maxPrice } : {}),
    };
  }
  if (search) {
    where[Op.or as unknown as string] = [
      { make: { [Op.iLike]: `%${search}%` } },
      { model: { [Op.iLike]: `%${search}%` } },
      { stockId: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Vehicle.findAndCountAll({
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    data: rows,
    pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
  });
});

export const getVehicleHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await Vehicle.findByPk(req.params.id);
  if (!vehicle) throw createError(404, 'Vehicle not found.');
  res.status(200).json(vehicle);
});

export const createVehicleHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createVehicleSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const existing = await Vehicle.findOne({ where: { stockId: parsed.data.stockId } });
  if (existing) throw createError(409, 'A vehicle with this stock ID already exists.');

  const vehicle = await Vehicle.create({
    ...parsed.data,
    country: parsed.data.country ?? null,
    images: parsed.data.images ?? [],
    description: parsed.data.description ?? null,
  });

  res.status(201).json(vehicle);
});

export const updateVehicleHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateVehicleSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const vehicle = await Vehicle.findByPk(req.params.id);
  if (!vehicle) throw createError(404, 'Vehicle not found.');

  await vehicle.update(parsed.data);
  res.status(200).json(vehicle);
});
