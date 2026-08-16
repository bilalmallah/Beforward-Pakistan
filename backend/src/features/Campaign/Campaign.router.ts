import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware';
import requireRole from '../../middleware/rbac';
import { UserRole } from '../User/User.model';
import {
  listCampaignsHandler,
  getCampaignHandler,
  createCampaignHandler,
  startCampaignHandler,
  pauseCampaignHandler,
  cancelCampaignHandler,
  retryFailedHandler,
} from './Campaign.controller';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get('/', listCampaignsHandler);
router.get('/:id', getCampaignHandler);
router.post('/', createCampaignHandler);
router.post('/:id/start', startCampaignHandler);
router.post('/:id/pause', pauseCampaignHandler);
router.post('/:id/cancel', cancelCampaignHandler);
router.post('/:id/retry-failed', retryFailedHandler);

export default router;
