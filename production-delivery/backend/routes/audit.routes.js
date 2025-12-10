import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), getAuditLogs);

export default router;