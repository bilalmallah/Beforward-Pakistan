import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware';
import requireRole from '../../middleware/rbac';
import { UserRole } from '../User/User.model';
import {
  verifyWebhookHandler,
  receiveWebhookHandler,
  getBusinessAccountHandler,
  getPhoneNumberHandler,
} from './WhatsApp.controller';

const router = Router();

// Webhook endpoints are intentionally NOT behind authMiddleware — Meta
// calls these directly. Security comes from the verify-token handshake
// (GET) and the X-Hub-Signature-256 check (POST), not a bearer token.
router.get('/webhook', verifyWebhookHandler);
router.post('/webhook', receiveWebhookHandler);

router.use(authMiddleware);
router.get(
  '/account',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  getBusinessAccountHandler
);
router.get(
  '/phone-number',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  getPhoneNumberHandler
);

/**
 * WhatsApp Webhook Verification
 * Meta sends a GET request when verifying the webhook.
 */
router.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (
    mode === 'subscribe' &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log('✅ WhatsApp webhook verified');

    return res.status(200).send(challenge);
  }

  console.log('❌ WhatsApp webhook verification failed');

  return res.sendStatus(403);
});


export default router;
