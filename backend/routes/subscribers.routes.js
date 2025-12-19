import express from 'express';
import { getAllSubscribers, createSubscriber, deleteSubscriber } from '../controllers/subscribers.controller.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireSuperAdmin, getAllSubscribers);
router.post('/', authenticateToken, createSubscriber);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteSubscriber);

export default router;