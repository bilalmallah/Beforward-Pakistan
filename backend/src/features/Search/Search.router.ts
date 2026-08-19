import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import { searchHandler } from './Search.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', searchHandler);

export default router;
