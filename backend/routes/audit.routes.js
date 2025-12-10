import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getAuditLogs);

export default router;