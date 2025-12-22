import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireSuperAdmin, getAuditLogs);

export default router;