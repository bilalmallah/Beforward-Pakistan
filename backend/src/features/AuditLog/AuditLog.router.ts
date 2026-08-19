import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware';
import requireRole from '../../middleware/rbac';
import { UserRole } from '../User/User.model';
import { listAuditLogsHandler } from './AuditLog.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), listAuditLogsHandler);

export default router;
