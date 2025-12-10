import express from 'express';
import { getAllSubscribers, createSubscriber, deleteSubscriber } from '../controllers/subscribers.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getAllSubscribers);
router.post('/', authenticateToken, createSubscriber);
router.delete('/:id', authenticateToken, requireAdmin, deleteSubscriber);

export default router;