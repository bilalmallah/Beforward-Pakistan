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

export default router;
