import express from 'express';
import { getAllDomains, createDomain, updateDomain, deleteDomain } from '../controllers/domains.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllDomains);
router.post('/', authenticateToken, requireAdmin, createDomain);
router.put('/:id', authenticateToken, requireAdmin, updateDomain);
router.delete('/:id', authenticateToken, requireAdmin, deleteDomain);

export default router;