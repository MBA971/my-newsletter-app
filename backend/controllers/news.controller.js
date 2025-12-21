import * as NewsModel from '../models/News.js';
import pool from '../utils/database.js';

export const getAllNews = async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const news = await NewsModel.getAllNews(includeArchived);
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getNewsById = async (req, res) => {
  try {
    const news = await NewsModel.getNewsById(req.params.id);
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createNews = async (req, res) => {
  try {
    const { title, domain_id, content } = req.body;
    const authorId = req.user.userId;

    // Determine if validation is needed based on user role
    const needsValidation = req.user.role !== 'super_admin';

    const news = await NewsModel.createNews(title, domain_id, content, authorId, needsValidation);
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateNews = async (req, res) => {
  try {
    const { title, domain_id, content } = req.body;
    const news = await NewsModel.updateNews(req.params.id, title, domain_id, content);
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteNews = async (req, res) => {
  try {
    // Check if user is admin (super_admin or domain_admin) for permanent deletion
    const isAdmin = req.user.role === 'super_admin' || req.user.role === 'domain_admin';

    if (isAdmin) {
      // Admins can permanently delete articles
      const deleted = await NewsModel.deleteNews(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'News not found' });
      }
      res.json({ message: 'News deleted permanently' });
    } else {
      // Contributors can only archive articles (soft delete)
      const result = await NewsModel.toggleArchiveNews(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'News not found' });
      }
      res.json({ message: 'News archived', archived: result.archived });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const searchNews = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const results = await NewsModel.searchNews(q);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const grantEditAccess = async (req, res) => {
  try {
    const { email } = req.body;
    await NewsModel.grantEditAccess(req.params.id, email);
    res.json({ message: 'Edit access granted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const likeNews = async (req, res) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const success = await NewsModel.likeNews(req.params.id, ipAddress);
    if (success) {
      res.json({ message: 'Liked successfully' });
    } else {
      res.status(400).json({ error: 'Already liked' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const toggleArchiveNews = async (req, res) => {
  try {
    const result = await NewsModel.toggleArchiveNews(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getArchivedNews = async (req, res) => {
  try {
    let domainId = null;

    // For domain admins, only show news from their assigned domain
    if (req.user.role === 'domain_admin') {
      // Use domain from JWT (it contains the domain ID after our auth fix)
      domainId = req.user.domain_id || req.user.domain;

      // If it's a string name, look up the ID (fallback for old tokens)
      if (domainId && typeof domainId === 'string' && isNaN(parseInt(domainId))) {
        const domainResult = await pool.query(
          'SELECT id FROM domains WHERE name = $1',
          [domainId]
        );
        if (domainResult.rows.length > 0) {
          domainId = domainResult.rows[0].id;
        }
      }
    }

    const news = await NewsModel.getArchivedNews(domainId);
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPendingValidationNews = async (req, res) => {
  try {
    let domainId = null;

    // For domain admins, only show news from their assigned domain
    if (req.user.role === 'domain_admin') {
      // Use domain from JWT (it contains the domain ID after our auth fix)
      domainId = req.user.domain_id || req.user.domain;

      // If it's a string name, look up the ID (fallback for old tokens)
      if (domainId && typeof domainId === 'string' && isNaN(parseInt(domainId))) {
        const domainResult = await pool.query(
          'SELECT id FROM domains WHERE name = $1',
          [domainId]
        );
        if (domainResult.rows.length > 0) {
          domainId = domainResult.rows[0].id;
        }
      }
    }

    const news = await NewsModel.getPendingValidationNews(domainId);
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const validateNews = async (req, res) => {
  try {
    const success = await NewsModel.validateNews(req.params.id, req.user.userId);
    if (!success) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json({ message: 'News validated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getContributorNews = async (req, res) => {
  try {
    const news = await NewsModel.getContributorNews(req.user.userId);
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllNewsForAdmin = async (req, res) => {
  try {
    console.log('[DEBUG] getAllNewsForAdmin - User:', req.user);
    let domainId = null;
    if (req.user.role === 'domain_admin') {
      console.log('[DEBUG] getAllNewsForAdmin - Domain admin, using domain from JWT:', req.user.domain);
      // For domain admins, use the domain ID from their JWT token
      domainId = req.user.domain;
    }

    const news = await NewsModel.getAllNewsForAdmin(domainId);
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};