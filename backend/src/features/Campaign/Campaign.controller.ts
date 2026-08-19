import { Request, Response } from 'express';
import createError from 'http-errors';
import asyncHandler from '../../utils/asyncHandler.js';
import Campaign from './Campaign.model.js';
import CampaignRecipient from './CampaignRecipient.model.js';
import { createCampaignSchema } from './Campaign.validator.js';
import * as CampaignService from './Campaign.service.js';
import { recordAudit } from '../AuditLog/AuditLog.service.js';

export const listCampaignsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const campaigns = await Campaign.findAll({ order: [['createdAt', 'DESC']] });
  res.status(200).json(campaigns);
});

export const getCampaignHandler = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await Campaign.findByPk(req.params.id, {
    include: [{ model: CampaignRecipient, as: 'recipients' }],
  });
  if (!campaign) throw createError(404, 'Campaign not found.');
  res.status(200).json(campaign);
});

export const createCampaignHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) throw createError(400, parsed.error.issues[0]?.message || 'Invalid input.');

  const campaign = await CampaignService.createCampaign({
    name: parsed.data.name,
    templateId: parsed.data.templateId,
    vehicleId: parsed.data.vehicleId ?? null,
    createdBy: req.user!.id,
    filters: parsed.data.filters,
  });

  res.status(201).json(campaign);
});

export const startCampaignHandler = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await CampaignService.startCampaign(req.params.id);
  await recordAudit({ req, action: 'CAMPAIGN_STARTED', entity: 'Campaign', entityId: campaign.id });
  res.status(200).json(campaign);
});

export const pauseCampaignHandler = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await CampaignService.pauseCampaign(req.params.id);
  await recordAudit({ req, action: 'CAMPAIGN_PAUSED', entity: 'Campaign', entityId: campaign.id });
  res.status(200).json(campaign);
});

export const cancelCampaignHandler = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await CampaignService.cancelCampaign(req.params.id);
  await recordAudit({ req, action: 'CAMPAIGN_CANCELLED', entity: 'Campaign', entityId: campaign.id });
  res.status(200).json(campaign);
});

export const retryFailedHandler = asyncHandler(async (req: Request, res: Response) => {
  const count = await CampaignService.retryFailed(req.params.id);
  res.status(200).json({ retried: count });
});
