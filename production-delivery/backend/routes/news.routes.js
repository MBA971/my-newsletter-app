import express from 'express';
import { getAllNews, getNewsById, createNews, updateNews, deleteNews, searchNews, grantEditAccess } from '../controllers/news.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllNews);
router.get('/item/:id', getNewsById);
router.get('/search', searchNews);
router.post('/', authenticateToken, requireRole('contributor', 'admin'), createNews);
router.put('/:id', authenticateToken, requireRole('contributor', 'admin'), updateNews);
router.delete('/:id', authenticateToken, deleteNews);
router.post('/:id/grant-edit', authenticateToken, requireRole('contributor', 'admin'), grantEditAccess);

export default router;