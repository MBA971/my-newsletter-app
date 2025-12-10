import express from 'express';
import { getAllDomains, createDomain, updateDomain, deleteDomain } from '../controllers/domains.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllDomains);
router.post('/', authenticateToken, requireRole('admin'), createDomain);
router.put('/:id', authenticateToken, requireRole('admin'), updateDomain);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteDomain);

export default router;