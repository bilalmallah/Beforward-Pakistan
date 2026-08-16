import { Router } from 'express';
import { loginHandler, refreshHandler, meHandler } from './Auth.controller';
import authMiddleware from '../../middleware/authMiddleware';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, loginHandler);
router.post('/refresh', authLimiter, refreshHandler);
router.get('/me', authMiddleware, meHandler);

export default router;
