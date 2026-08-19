import createError from 'http-errors';
import { Op } from 'sequelize';
import Campaign, { CampaignStatus } from './Campaign.model.js';
import CampaignRecipient, { RecipientStatus } from './CampaignRecipient.model.js';
import Customer from '../Customer/Customer.model.js';
import Template, { TemplateStatus } from '../WhatsApp/Template.model.js';
import { enqueueRecipient } from './Campaign.queue.js';

interface CreateCampaignInput {
  name: string;
  templateId: string;
  vehicleId: string | null;
  createdBy: string;
  filters?: {
    status?: string;
    country?: string;
    assignedTeamId?: string;
    tag?: string;
  };
}

/**
 * Creates a campaign and its recipient rows in one pass, validating each
 * candidate customer up front (spec section 36): valid WhatsApp number,
 * marketing eligibility (opted in, not opted out — spec section 18/19),
 * and an approved template. Ineligible customers are still recorded as
 * SKIPPED with a reason rather than silently omitted, so the campaign's
 * audience is fully accounted for.
 */
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const template = await Template.findByPk(input.templateId);
  if (!template) throw createError(404, 'Template not found.');
  if (template.status !== TemplateStatus.APPROVED) {
    throw createError(422, `Template is not approved (current status: ${template.status}).`);
  }

  const where: Record<string, unknown> = {};
  if (input.filters?.status) where.status = input.filters.status;
  if (input.filters?.country) where.country = input.filters.country;
  if (input.filters?.assignedTeamId) where.assignedTeamId = input.filters.assignedTeamId;
  if (input.filters?.tag) where.tags = { [Op.contains]: [input.filters.tag] };

  const candidates = await Customer.findAll({ where });

  const campaign = await Campaign.create({
    name: input.name,
    templateId: input.templateId,
    vehicleId: input.vehicleId,
    createdBy: input.createdBy,
    status: CampaignStatus.VALIDATING,
    totalRecipients: candidates.length,
  });

  const recipients = candidates.map((customer) => {
    const reason = ineligibilityReason(customer);
    return {
      campaignId: campaign.id,
      customerId: customer.id,
      status: reason ? RecipientStatus.SKIPPED : RecipientStatus.PENDING,
      skippedReason: reason,
    };
  });

  // Duplicate protection (spec section 38) is enforced at the DB level via
  // a unique (campaign_id, customer_id) constraint — bulkCreate here can
  // never violate it since each campaign is newly created.
  await CampaignRecipient.bulkCreate(recipients);

  await campaign.update({ status: CampaignStatus.DRAFT });
  return campaign;
}

function ineligibilityReason(customer: Customer): string | null {
  if (!customer.whatsappNumber) return 'No WhatsApp number on file.';
  if (customer.optedOut) return 'Customer has opted out of marketing.';
  if (!customer.marketingOptIn) return 'Customer has not opted in to marketing.';
  return null;
}

export async function startCampaign(campaignId: string): Promise<Campaign> {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) throw createError(404, 'Campaign not found.');
  if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.PAUSED) {
    throw createError(422, `Campaign cannot be started from status ${campaign.status}.`);
  }

  const pendingRecipients = await CampaignRecipient.findAll({
    where: { campaignId, status: RecipientStatus.PENDING },
  });

  for (const recipient of pendingRecipients) {
    await recipient.update({ status: RecipientStatus.QUEUED });
    await enqueueRecipient(campaign.id, recipient.id);
  }

  await campaign.update({ status: CampaignStatus.RUNNING });
  return campaign;
}

/**
 * Pausing prevents further PENDING → QUEUED transitions but doesn't yank
 * jobs already in flight — interrupting a send mid-request risks losing
 * track of a message that did go out. Resuming re-queues only recipients
 * still PENDING.
 */
export async function pauseCampaign(campaignId: string): Promise<Campaign> {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) throw createError(404, 'Campaign not found.');
  await campaign.update({ status: CampaignStatus.PAUSED });
  return campaign;
}

export async function cancelCampaign(campaignId: string): Promise<Campaign> {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) throw createError(404, 'Campaign not found.');
  await campaign.update({ status: CampaignStatus.FAILED, completedAt: new Date() });
  await CampaignRecipient.update(
    { status: RecipientStatus.SKIPPED, skippedReason: 'Campaign cancelled.' },
    { where: { campaignId, status: RecipientStatus.PENDING } }
  );
  return campaign;
}

export async function retryFailed(campaignId: string): Promise<number> {
  const failedRecipients = await CampaignRecipient.findAll({
    where: { campaignId, status: RecipientStatus.FAILED },
  });

  for (const recipient of failedRecipients) {
    await recipient.update({ status: RecipientStatus.QUEUED });
    await enqueueRecipient(campaignId, recipient.id);
  }

  return failedRecipients.length;
}
