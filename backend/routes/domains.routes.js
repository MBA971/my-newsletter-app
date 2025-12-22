import express from 'express';
import { getAllDomains, createDomain, updateDomain, deleteDomain } from '../controllers/domains.controller.js';
import { authenticateToken, requireSuperAdmin, requireDomainAdmin } from '../middleware/auth.js';
import { validateDomain, handleValidationErrors } from '../utils/validation.js';
import { domainCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

router.get('/', domainCacheMiddleware(), getAllDomains);
router.post('/', authenticateToken, requireSuperAdmin, validateDomain, handleValidationErrors, createDomain);
router.put('/:id', authenticateToken, requireDomainAdmin, validateDomain, handleValidationErrors, updateDomain);
router.delete('/:id', authenticateToken, requireSuperAdmin, deleteDomain);

export default router;