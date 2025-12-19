import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser, getUsersByDomain } from '../controllers/users.controller.js';
import { authenticateToken, requireSuperAdmin, requireDomainAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireSuperAdmin, getAllUsers);
router.get('/by-domain', authenticateToken, requireDomainAdmin, getUsersByDomain);
router.post('/', authenticateToken, requireSuperAdmin, createUser);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteUser);

export default router;