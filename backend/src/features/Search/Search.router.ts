import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware';
import { searchHandler } from './Search.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', searchHandler);

export default router;
