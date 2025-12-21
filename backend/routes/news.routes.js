import express from 'express';
import { getAllNews, getNewsById, createNews, updateNews, deleteNews, searchNews, grantEditAccess, likeNews, toggleArchiveNews, getArchivedNews, getPendingValidationNews, validateNews as controllerValidateNews, getContributorNews, getAllNewsForAdmin } from '../controllers/news.controller.js';
import { authenticateToken, requireContributor, requireAdmin, requireDomainAdmin } from '../middleware/auth.js';
import { validateNews, handleValidationErrors } from '../utils/validation.js';
import { newsCacheMiddleware, domainCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Test route to verify routing
router.get('/test-routing', (req, res) => {
  res.json({ message: 'Test route working correctly' });
});

// Specific routes first (before parameterized routes)
router.get('/', newsCacheMiddleware(), getAllNews);
router.get('/admin', authenticateToken, requireDomainAdmin, getAllNewsForAdmin); // New route for admin users
router.get('/contributor', authenticateToken, requireContributor, getContributorNews); // For contributors to get their own articles
router.get('/archived', authenticateToken, requireDomainAdmin, newsCacheMiddleware(), getArchivedNews); // Domain admin and super admin only
router.get('/pending-validation', authenticateToken, requireDomainAdmin, getPendingValidationNews); // Domain admin and super admin only
router.get('/search', searchNews);

// Parameterized routes last
router.get('/:id', getNewsById);

// POST, PUT, DELETE routes
router.post('/', authenticateToken, requireContributor, validateNews, handleValidationErrors, createNews);
router.put('/:id', authenticateToken, requireContributor, validateNews, handleValidationErrors, updateNews);
router.delete('/:id', authenticateToken, requireContributor, deleteNews); // Changed to archive for contributors, delete for admins
router.post('/:id/grant-edit', authenticateToken, requireContributor, grantEditAccess);
router.post('/:id/toggle-archive', authenticateToken, requireDomainAdmin, toggleArchiveNews); // Domain admin and super admin only
router.post('/:id/validate', authenticateToken, requireDomainAdmin, validateNews, handleValidationErrors, controllerValidateNews); // Domain admin and super admin only
// New route for liking articles (no authentication required for public likes)
router.post('/:id/like', likeNews);

export default router;