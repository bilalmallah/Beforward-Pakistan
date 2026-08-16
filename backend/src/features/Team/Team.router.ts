import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware';
import requireRole from '../../middleware/rbac';
import { UserRole } from '../User/User.model';
import {
  listTeamsHandler,
  getTeamHandler,
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
} from './Team.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', listTeamsHandler);
router.get('/:id', getTeamHandler);
router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), createTeamHandler);
router.patch('/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), updateTeamHandler);
router.delete('/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), deleteTeamHandler);

export default router;
