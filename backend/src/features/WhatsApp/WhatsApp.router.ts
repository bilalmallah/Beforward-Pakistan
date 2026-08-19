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


router.post("/register", async (req, res) => {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    const pin = req.body.pin;

    if (!phoneNumberId || !accessToken) {
      return res.status(500).json({
        error: "WhatsApp environment variables are missing",
      });
    }

    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        error: "A 6-digit PIN is required",
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          pin,
        }),
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("WhatsApp registration error:", error);

    return res.status(500).json({
      error: "WhatsApp registration failed",
    });
  }
});


export default router;
