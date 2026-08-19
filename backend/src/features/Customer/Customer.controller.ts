import { Request, Response } from 'express';
import createError from 'http-errors';
import { Op } from 'sequelize';
import asyncHandler from '../../utils/asyncHandler';
import Customer, { CallPermissionStatus } from './Customer.model';
import CustomerNote from './CustomerNote.model';
import AssignmentHistory from './AssignmentHistory.model';
import User from '../User/User.model';
import Team from '../Team/Team.model';
import {
  createCustomerSchema,
  updateCustomerSchema,
  setMarketingConsentSchema,
  assignCustomerSchema,
  createNoteSchema,
  listCustomersQuerySchema,
} from './Customer.validator';
import { assignCustomer } from './Assignment.service';
import { UserRole } from '../User/User.model';
import { recordAudit } from '../AuditLog/AuditLog.service';

const profileIncludes = [
  { model: User, as: 'assignedSeller', attributes: ['id', 'fullName', 'email'] },
  { model: Team, as: 'assignedTeam', attributes: ['id', 'name'] },
  { model: User, as: 'creator', attributes: ['id', 'fullName'] },
];

export const listCustomersHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = listCustomersQuerySchema.safeParse(req.query);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid query.');
  const { status, country, assignedSellerId, assignedTeamId, source, tag, search, page, pageSize } =
    parsed.data;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (country) where.country = country;
  if (assignedTeamId) where.assignedTeamId = assignedTeamId;
  if (source) where.source = source;
  if (tag) where.tags = { [Op.contains]: [tag] };
  if (search) {
    where[Op.or as unknown as string] = [
      { companyName: { [Op.iLike]: `%${search}%` } },
      { contactName: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
      { whatsappNumber: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Salespeople only ever see their own book; Managers see their team's;
  // Admin/Super Admin see everything (RBAC enforced here, not just at the
  // route level, since visibility is row-scoped rather than all-or-nothing).
  const requester = req.user!;
  if (requester.role === UserRole.SALESPERSON) {
    where.assignedSellerId = requester.id;
  } else if (requester.role === UserRole.MANAGER) {
    where.assignedTeamId = requester.teamId;
  } else if (assignedSellerId) {
    where.assignedSellerId = assignedSellerId;
  }

  const { rows, count } = await Customer.findAndCountAll({
    where,
    include: profileIncludes,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    data: rows,
    pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) },
  });
});

export const getCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findByPk(req.params.id, {
    include: [
      ...profileIncludes,
      { model: CustomerNote, as: 'notes', include: [{ model: User, as: 'author', attributes: ['id', 'fullName'] }] },
      { model: AssignmentHistory, as: 'assignmentHistory' },
    ],
  });
  if (!customer) throw createError(404, 'Customer not found.');

  const requester = req.user!;
  if (requester.role === UserRole.SALESPERSON && customer.assignedSellerId !== requester.id) {
    throw createError(403, 'You do not have access to this customer.');
  }

  res.status(200).json(customer);
});

export const createCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const customer = await Customer.create({
    ...parsed.data,
    contactName: parsed.data.contactName ?? null,
    country: parsed.data.country ?? null,
    city: parsed.data.city ?? null,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    whatsappNumber: parsed.data.whatsappNumber ?? null,
    website: parsed.data.website ?? null,
    sourceReference: parsed.data.sourceReference ?? null,
    tags: parsed.data.tags ?? [],
    createdBy: req.user!.id,
  });

  res.status(201).json(customer);
});

export const updateCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const customer = await Customer.findByPk(req.params.id);
  if (!customer) throw createError(404, 'Customer not found.');

  await customer.update(parsed.data);
  res.status(200).json(customer);
});

export const setMarketingConsentHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = setMarketingConsentSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const customer = await Customer.findByPk(req.params.id);
  if (!customer) throw createError(404, 'Customer not found.');

  if (parsed.data.optIn) {
    if (!parsed.data.optInSource) {
      throw createError(400, 'optInSource is required when granting marketing consent.');
    }
    await customer.update({
      marketingOptIn: true,
      optInSource: parsed.data.optInSource,
      optInAt: new Date(),
      optedOut: false,
      optedOutAt: null,
    });
  } else {
    await customer.update({
      marketingOptIn: false,
      optedOut: true,
      optedOutAt: new Date(),
    });
  }

  res.status(200).json(customer);
});

export const assignCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = assignCustomerSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const customer = await assignCustomer({
    customerId: req.params.id,
    assignedByUserId: req.user!.id,
    method: parsed.data.method,
    sellerId: parsed.data.sellerId,
    teamId: parsed.data.teamId,
    reason: parsed.data.reason,
  });

  await recordAudit({
    req,
    action: 'CUSTOMER_REASSIGNED',
    entity: 'Customer',
    entityId: customer.id,
    metadata: { method: parsed.data.method, sellerId: parsed.data.sellerId, reason: parsed.data.reason },
  });

  res.status(200).json(customer);
});

export const addNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const customer = await Customer.findByPk(req.params.id);
  if (!customer) throw createError(404, 'Customer not found.');

  const note = await CustomerNote.create({
    customerId: customer.id,
    authorId: req.user!.id,
    body: parsed.data.body,
  });

  res.status(201).json(note);
});

/**
 * Requests calling permission (spec section 20). This sets the status to
 * PENDING; the actual permission template (e.g. "SBT Japan wants to call
 * you — YES/NO") is sent through the normal template-send flow with a
 * template tagged for this purpose. The customer's reply is parsed in
 * Webhook.service.ts, which flips this to GRANTED/DENIED — calling
 * itself is never allowed to bypass that mechanism (spec section 20).
 */
export const requestCallPermissionHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) throw createError(404, 'Customer not found.');

  await customer.update({ callPermissionStatus: CallPermissionStatus.PENDING });
  res.status(200).json(customer);
});
