import { Queue } from 'bullmq';
import redisConnection from '../../queue/redis.js';

export interface CampaignSendJobData {
  campaignId: string;
  recipientId: string;
}

/**
 * Job enqueueing only — the actual throttling (spec section 21: an
 * internal CRM safety rule, explicitly NOT a universal Meta API limit,
 * see spec section 62) happens on the Worker side via its `limiter`
 * option, configurable through CAMPAIGN_MESSAGES_PER_MINUTE.
 */
export const campaignQueue = new Queue<CampaignSendJobData>('campaign-send', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

export async function enqueueRecipient(campaignId: string, recipientId: string): Promise<void> {
  await campaignQueue.add('send', { campaignId, recipientId });
}
