import { Request, Response } from 'express';
import createError from 'http-errors';
import asyncHandler from '../../utils/asyncHandler';
import Template, { TemplateStatus } from './Template.model';
import { createTemplateSchema, updateTemplateStatusSchema } from './Template.validator';
import { assertVariablesAreKnown } from './TemplateVariable.service';

export const listTemplatesHandler = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as TemplateStatus | undefined;
  const templates = await Template.findAll({
    where: status ? { status } : undefined,
    order: [['createdAt', 'DESC']],
  });
  res.status(200).json(templates);
});

export const getTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const template = await Template.findByPk(req.params.id);
  if (!template) throw createError(404, 'Template not found.');
  res.status(200).json(template);
});

export const createTemplateHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createTemplateSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  // Reject unsupported {{variables}} up front — a template that can never
  // resolve is worse than one that fails clearly at creation time.
  assertVariablesAreKnown(parsed.data.variables ?? []);

  const template = await Template.create({
    ...parsed.data,
    headerType: parsed.data.headerType ?? null,
    footer: parsed.data.footer ?? null,
    buttons: parsed.data.buttons ?? [],
    variables: parsed.data.variables ?? [],
    mediaRequirements: parsed.data.mediaRequirements ?? null,
    status: TemplateStatus.DRAFT,
    createdBy: req.user!.id,
  });

  res.status(201).json(template);
});

/**
 * Updates a template's lifecycle status. In production this transitions
 * to PENDING/APPROVED/REJECTED based on what Meta reports for the
 * submitted template (spec section 13) — that submission flow itself is
 * built once Phase 4's live credentials are in place; until then this
 * endpoint lets Admins manage the local record directly.
 */
export const updateTemplateStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateTemplateStatusSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const template = await Template.findByPk(req.params.id);
  if (!template) throw createError(404, 'Template not found.');

  await template.update({
    status: parsed.data.status,
    metaTemplateId: parsed.data.metaTemplateId ?? template.metaTemplateId,
    rejectedReason: parsed.data.rejectedReason ?? null,
    approvedAt: parsed.data.status === TemplateStatus.APPROVED ? new Date() : template.approvedAt,
  });

  res.status(200).json(template);
});
