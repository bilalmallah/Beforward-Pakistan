import { Worker, Job } from 'bullmq';
import { Op } from 'sequelize';
import redisConnection from '../../queue/redis.js';
import config from '../../config/config.js';
import logger from '../../utils/logger.js';
import { CampaignSendJobData } from './Campaign.queue.js';
import Campaign, { CampaignStatus } from './Campaign.model.js';
import CampaignRecipient, { RecipientStatus } from './CampaignRecipient.model.js';
import Customer from '../Customer/Customer.model.js';
import Template from '../WhatsApp/Template.model.js';
import Vehicle from '../Vehicle/Vehicle.model.js';
import User from '../User/User.model.js';
import Message, { MessageDirection, MessageStatus, MessageType } from '../Conversation/Message.model.js';
import MessageEvent from '../Conversation/MessageEvent.model.js';
import { getOrCreateConversation } from '../Conversation/Conversation.service.js';
import { resolveVariables, renderBody } from '../WhatsApp/TemplateVariable.service.js';
import * as WhatsAppService from '../WhatsApp/WhatsApp.service.js';
import { notify } from '../Notification/Notification.service.js';
import { NotificationType } from '../Notification/Notification.model.js';

async function processRecipient(job: Job<CampaignSendJobData>): Promise<void> {
  const { campaignId, recipientId } = job.data;

  const recipient = await CampaignRecipient.findByPk(recipientId);
  const campaign = await Campaign.findByPk(campaignId);
  if (!recipient || !campaign) return;

  // A paused/cancelled campaign should not process jobs that were already
  // sitting in the queue when the pause happened.
  if (campaign.status === CampaignStatus.PAUSED || campaign.status === CampaignStatus.FAILED) {
    return;
  }

  const customer = await Customer.findByPk(recipient.customerId);
  const template = await Template.findByPk(campaign.templateId);
  if (!customer || !template) {
    await recipient.update({
      status: RecipientStatus.SKIPPED,
      skippedReason: 'Customer or template no longer exists.',
    });
    return;
  }

  try {
    const vehicle = campaign.vehicleId ? await Vehicle.findByPk(campaign.vehicleId) : null;
    const creator = await User.findByPk(campaign.createdBy);
    const resolved = resolveVariables(template.variables, { customer, seller: creator, vehicle });
    const renderedBody = renderBody(template.body, resolved);

    const conversation = await getOrCreateConversation(customer.id);

    const message = await Message.create({
      conversationId: conversation.id,
      customerId: customer.id,
      sellerId: campaign.createdBy,
      campaignId: campaign.id,
      templateId: template.id,
      direction: MessageDirection.OUTBOUND,
      messageType: MessageType.TEMPLATE,
      body: renderedBody,
      status: MessageStatus.QUEUED,
    });

    if (!customer.whatsappNumber) {
      throw new Error('Customer has no WhatsApp number on file.');
    }

    const components = [
      { type: 'body', parameters: template.variables.map((name) => ({ type: 'text', text: resolved[name] })) },
    ];
    const result = await WhatsAppService.sendTemplate(
      customer.whatsappNumber,
      template.name,
      template.language,
      components
    );
    await message.update({
      status: MessageStatus.SENT,
      sentAt: new Date(),
      whatsappMessageId: result.whatsappMessageId,
    });
    await MessageEvent.create({
      messageId: message.id,
      eventType: 'CAMPAIGN_SENT',
      rawPayload: result.raw as Record<string, unknown>,
    });
    await recipient.update({ status: RecipientStatus.SENT, messageId: message.id });
    await campaign.increment('sent');
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown error.';
    await recipient.update({ status: RecipientStatus.FAILED, skippedReason: reason });
    await campaign.increment('failed');
    logger.error('Campaign recipient send failed', { campaignId, recipientId, reason });
    throw err; // let BullMQ apply its retry/backoff policy
  }

  await maybeCompleteCampaign(campaignId);
}

async function maybeCompleteCampaign(campaignId: string): Promise<void> {
  const outstanding = await CampaignRecipient.count({
    where: { campaignId, status: { [Op.in]: [RecipientStatus.PENDING, RecipientStatus.QUEUED] } },
  });
  if (outstanding === 0) {
    const campaign = await Campaign.findByPk(campaignId);
    if (campaign && campaign.status === CampaignStatus.RUNNING) {
      await campaign.update({ status: CampaignStatus.COMPLETED, completedAt: new Date() });
      await notify({
        userId: campaign.createdBy,
        type: NotificationType.CAMPAIGN_COMPLETED,
        title: `Campaign "${campaign.name}" completed`,
        body: `${campaign.sent} sent, ${campaign.failed} failed.`,
        entityType: 'Campaign',
        entityId: campaign.id,
      });
    }
  }
}

let worker: Worker<CampaignSendJobData> | null = null;

/**
 * Starts the campaign worker. Call once from the app's bootstrap. The
 * `limiter` option is the real implementation of spec section 21's
 * internal rate-limiting rule — configurable, and explicitly not a Meta
 * API limit (spec section 62).
 */
export function startCampaignWorker(): Worker<CampaignSendJobData> {
  if (worker) return worker;

  worker = new Worker<CampaignSendJobData>('campaign-send', processRecipient, {
    connection: redisConnection,
    limiter: {
      max: config.campaign.messagesPerMinute,
      duration: 60_000,
    },
  });

  worker.on('failed', (job, err) => {
    logger.error('Campaign job failed permanently', { jobId: job?.id, err: err.message });
  });

  return worker;
}
