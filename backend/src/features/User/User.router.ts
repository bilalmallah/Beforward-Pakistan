import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware';
import requireRole from '../../middleware/rbac';
import { UserRole } from './User.model';
import {
  listUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  deactivateUserHandler,
} from './User.controller';

const router = Router();

// Only Super Admin / Admin can manage users, per spec section 3 (RBAC).
router.use(authMiddleware);
router.get('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), listUsersHandler);
router.get('/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), getUserHandler);
router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), createUserHandler);
router.patch('/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), updateUserHandler);
router.post('/:id/deactivate', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), deactivateUserHandler);

export default router;
