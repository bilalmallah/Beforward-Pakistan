import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import requireRole from '../../middleware/rbac.js';
import { UserRole } from '../User/User.model.js';
import { listAuditLogsHandler } from './AuditLog.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), listAuditLogsHandler);

export default router;
