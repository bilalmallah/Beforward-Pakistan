import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import requireRole from '../../middleware/rbac.js';
import { UserRole } from '../User/User.model.js';
import {
  verifyWebhookHandler,
  receiveWebhookHandler,
  getBusinessAccountHandler,
  getPhoneNumberHandler,
  getHealthHandler,
} from './WhatsApp.controller.js';

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
router.get('/health', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), getHealthHandler);

export default router;
