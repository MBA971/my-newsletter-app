import express from 'express';
import { getAllSubscribers, createSubscriber, deleteSubscriber } from '../controllers/subscribers.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), getAllSubscribers);
router.post('/', authenticateToken, createSubscriber);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteSubscriber);

export default router;