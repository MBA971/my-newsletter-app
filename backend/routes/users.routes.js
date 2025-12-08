import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), getAllUsers);
router.post('/', authenticateToken, requireRole('admin'), createUser);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteUser);

export default router;