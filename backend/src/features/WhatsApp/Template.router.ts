import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import requireRole from '../../middleware/rbac.js';
import { UserRole } from '../User/User.model.js';
import {
  listTemplatesHandler,
  getTemplateHandler,
  createTemplateHandler,
  updateTemplateStatusHandler,
} from './Template.controller.js';

const router = Router();

router.use(authMiddleware);

// Everyone can browse approved templates (needed to send them from the
// inbox); only Admin/Super Admin manage the template lifecycle.
router.get('/', listTemplatesHandler);
router.get('/:id', getTemplateHandler);
router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), createTemplateHandler);
router.patch('/:id/status', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), updateTemplateStatusHandler);

export default router;
