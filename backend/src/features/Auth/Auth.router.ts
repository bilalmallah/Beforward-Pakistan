import { Router } from 'express';
import { loginHandler, refreshHandler, meHandler } from './Auth.controller.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { authLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, loginHandler);
router.post('/refresh', authLimiter, refreshHandler);
router.get('/me', authMiddleware, meHandler);

export default router;
