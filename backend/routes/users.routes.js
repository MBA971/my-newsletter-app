import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser, getUsersByDomain } from '../controllers/users.controller.js';
import { authenticateToken, requireSuperAdmin, requireDomainAdmin } from '../middleware/auth.js';
import { validateUser, handleValidationErrors } from '../utils/validation.js';
import { userCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

router.get('/', authenticateToken, requireSuperAdmin, userCacheMiddleware(), getAllUsers);
router.get('/by-domain', authenticateToken, requireDomainAdmin, userCacheMiddleware(), getUsersByDomain);
router.post('/', authenticateToken, requireSuperAdmin, validateUser, handleValidationErrors, createUser);
router.put('/:id', authenticateToken, validateUser, handleValidationErrors, updateUser);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteUser);

export default router;