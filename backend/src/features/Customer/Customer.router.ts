import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware';
import requireRole from '../../middleware/rbac';
import { UserRole } from '../User/User.model';
import {
  listCustomersHandler,
  getCustomerHandler,
  createCustomerHandler,
  updateCustomerHandler,
  setMarketingConsentHandler,
  assignCustomerHandler,
  addNoteHandler,
} from './Customer.controller';

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

export default router;
