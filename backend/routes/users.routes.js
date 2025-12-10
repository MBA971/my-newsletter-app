import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.post('/', authenticateToken, requireAdmin, createUser);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;