import express from 'express';
import { getAllDomains, createDomain, updateDomain, deleteDomain } from '../controllers/domains.controller.js';
import { authenticateToken, requireSuperAdmin, requireDomainAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllDomains);
router.post('/', authenticateToken, requireSuperAdmin, createDomain);
router.put('/:id', authenticateToken, requireDomainAdmin, updateDomain);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteDomain);

export default router;