import { Router } from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import {
  listTicketsHandler,
  getTicketHandler,
  createTicketHandler,
  updateTicketHandler,
} from './Ticket.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listTicketsHandler);
router.get('/:id', getTicketHandler);
router.post('/', createTicketHandler);
router.patch('/:id', updateTicketHandler);

export default router;
