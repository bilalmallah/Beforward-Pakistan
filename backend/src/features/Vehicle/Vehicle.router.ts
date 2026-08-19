import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import requireRole from '../../middleware/rbac.js';
import { UserRole } from '../User/User.model.js';
import {
  listVehiclesHandler,
  getVehicleHandler,
  createVehicleHandler,
  updateVehicleHandler,
} from './Vehicle.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listVehiclesHandler);
router.get('/:id', getVehicleHandler);
router.post('/', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), createVehicleHandler);
router.patch('/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), updateVehicleHandler);

export default router;
