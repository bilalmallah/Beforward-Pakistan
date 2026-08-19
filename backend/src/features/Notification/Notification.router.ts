import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { listNotificationsHandler, markReadHandler, markAllReadHandler } from './Notification.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', listNotificationsHandler);
router.post('/:id/read', markReadHandler);
router.post('/read-all', markAllReadHandler);

export default router;
