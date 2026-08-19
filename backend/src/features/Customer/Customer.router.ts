import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import requireRole from '../../middleware/rbac.js';
import { UserRole } from '../User/User.model.js';
import {
  listCustomersHandler,
  getCustomerHandler,
  createCustomerHandler,
  updateCustomerHandler,
  setMarketingConsentHandler,
  assignCustomerHandler,
  addNoteHandler,
  requestCallPermissionHandler,
} from './Customer.controller.js';

const router = Router();

router.use(authMiddleware);

// Visibility is row-scoped inside the controller (salesperson -> own book,
// manager -> own team, admin/super admin -> everything), so every
// authenticated role can call list/get; RBAC below only gates
// creation/mutation actions.
router.get('/', listCustomersHandler);
router.get('/:id', getCustomerHandler);

router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON),
  createCustomerHandler
);
router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON),
  updateCustomerHandler
);

// Marketing consent changes are deliberately gated tighter than a general
// profile edit (spec section 18/19) — opt-in/opt-out is a compliance-sensitive action.
router.post(
  '/:id/marketing-consent',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON),
  setMarketingConsentHandler
);

// Reassignment: managers can reassign within their team, admins anywhere.
router.post(
  '/:id/assign',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  assignCustomerHandler
);

router.post(
  '/:id/notes',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON),
  addNoteHandler
);

// Calling must be separate from messaging (spec section 20) — this only
// flips status to PENDING; GRANTED/DENIED only ever comes from the
// customer's actual reply, parsed in Webhook.service.ts.
router.post(
  '/:id/call-permission/request',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON),
  requestCallPermissionHandler
);

export default router;
