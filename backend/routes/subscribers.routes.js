import express from 'express';
import { getAllSubscribers, createSubscriber, deleteSubscriber } from '../controllers/subscribers.controller.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';
import { validateSubscriber, handleValidationErrors } from '../utils/validation.js';

const router = express.Router();

router.get('/', authenticateToken, requireSuperAdmin, getAllSubscribers);
router.post('/', validateSubscriber, handleValidationErrors, createSubscriber);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteSubscriber);

export default router;