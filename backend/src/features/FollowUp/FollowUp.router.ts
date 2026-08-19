import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { listFollowUpsHandler, createFollowUpHandler, updateFollowUpHandler } from './FollowUp.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listFollowUpsHandler);
router.post('/', createFollowUpHandler);
router.patch('/:id', updateFollowUpHandler);

export default router;
