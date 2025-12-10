import express from 'express';
import { getAllNews, getNewsById, createNews, updateNews, deleteNews, searchNews, grantEditAccess } from '../controllers/news.controller.js';
import { authenticateToken, requireContributor, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllNews);
router.get('/:id', getNewsById);
router.get('/search', searchNews);
router.post('/', authenticateToken, requireContributor, createNews);
router.put('/:id', authenticateToken, requireContributor, updateNews);
router.delete('/:id', authenticateToken, deleteNews);
router.post('/:id/grant-edit', authenticateToken, requireContributor, grantEditAccess);

export default router;