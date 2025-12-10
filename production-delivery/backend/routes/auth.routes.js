import express from 'express';
import { login, logout, refresh } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/refresh', refresh);

export default router;