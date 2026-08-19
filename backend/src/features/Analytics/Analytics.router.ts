import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import requireRole from '../../middleware/rbac.js';
import { UserRole } from '../User/User.model.js';
import {
  getDashboardHandler,
  getSellerAnalyticsHandler,
  getMySellerAnalyticsHandler,
  getTeamAnalyticsHandler,
  getCampaignAnalyticsHandler,
  getVehicleAnalyticsHandler,
} from './Analytics.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), getDashboardHandler);
router.get('/me', getMySellerAnalyticsHandler);
router.get(
  '/sellers/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  getSellerAnalyticsHandler
);
router.get('/teams/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), getTeamAnalyticsHandler);
router.get('/campaigns/:id', requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN), getCampaignAnalyticsHandler);
router.get('/vehicles', getVehicleAnalyticsHandler);

export default router;
