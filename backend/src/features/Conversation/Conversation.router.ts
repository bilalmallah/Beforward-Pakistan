import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware';
import requireRole from '../../middleware/rbac';
import { UserRole } from '../User/User.model';
import {
  listConversationsHandler,
  getConversationHandler,
  sendMessageHandler,
  sendTemplateMessageHandler,
  overrideTemplateLimitHandler,
  markReadHandler,
  simulateInboundHandler,
} from './Conversation.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', listConversationsHandler);
router.get('/:id', getConversationHandler);
router.post('/:id/messages', sendMessageHandler);
router.post('/:id/template-messages', sendTemplateMessageHandler);
router.post(
  '/:id/template-limit/override',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  overrideTemplateLimitHandler
);
router.post('/:id/read', markReadHandler);

// Dev-only — see Conversation.controller.ts. Not a real WhatsApp channel;
// replaced by the Phase 4 webhook, not kept alongside it.
router.post('/simulate-inbound', requireRole(UserRole.SUPER_ADMIN), simulateInboundHandler);

export default router;
