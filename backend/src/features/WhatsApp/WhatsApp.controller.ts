import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import { verifySignature, verifyWebhookChallenge, processWebhookPayload } from './Webhook.service';
import * as WhatsAppService from './WhatsApp.service';
import * as WhatsAppHealthService from './WhatsAppHealth.service';

/** Meta's subscription verification handshake. */
export const verifyWebhookHandler = (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = verifyWebhookChallenge(mode, token, challenge);
  if (result !== null) {
    res.status(200).send(result);
  } else {
    res.status(403).json({ error: 'Webhook verification failed.' });
  }
};

/**
 * Receives real Meta webhook events (inbound messages, status updates).
 * Signature-validated before any processing (spec section 9). Always
 * responds 200 quickly, per Meta's requirements, even if internal
 * processing logs a warning for an unmatched customer/message.
 */
export const receiveWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;

  if (!rawBody || !verifySignature(rawBody, signature)) {
    logger.warn('Rejected WhatsApp webhook — invalid or missing signature.');
    res.status(401).json({ error: 'Invalid signature.' });
    return;
  }

  // Acknowledge immediately, process after — Meta expects a fast 200.
  res.status(200).json({ received: true });

  try {
    await processWebhookPayload(req.body);
  } catch (err) {
    logger.error('Error processing WhatsApp webhook payload.', { err });
  }
});

export const getBusinessAccountHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await WhatsAppService.getBusinessAccount();
  res.status(200).json(data);
});

export const getPhoneNumberHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await WhatsAppService.getPhoneNumber();
  res.status(200).json(data);
});

/**
 * Account health dashboard (spec section 33-34). Deliberately returns
 * metaStatus and internalHealth as separate top-level fields — never
 * merged into one "quality score" — so the UI can never conflate our
 * analytics with Meta's actual account state.
 */
export const getHealthHandler = asyncHandler(async (_req: Request, res: Response) => {
  const [metaStatus, internalHealth, templates, recentErrors] = await Promise.all([
    WhatsAppHealthService.getMetaStatus(),
    WhatsAppHealthService.calculateInternalHealth(),
    WhatsAppHealthService.getTemplateSummary(),
    WhatsAppHealthService.getRecentErrors(),
  ]);

  res.status(200).json({ metaStatus, internalHealth, templates, recentErrors });
});
