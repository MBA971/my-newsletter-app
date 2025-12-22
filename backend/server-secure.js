import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
    authenticateToken,
    requireAdmin,
    requireContributor,
    requireDomainAdmin,
    checkDomainAccess,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    requireRole
} from './middleware/auth.js';
import {
    validateLogin,
    validateUserCreation,
    validateUserUpdate,
    validateNewsCreation,
    validateDomainCreation,
    validateSubscriber
} from './middleware/validators.js';

// Import the auto-archive job
import { startAutoArchiveJob } from './jobs/auto-archive.js';

dotenv.config();

const app = express();
// Configure trust proxy for rate limiting when behind reverse proxy (Traefik)
app.set('trust proxy', 1);
let port = process.env.PORT || 3002;

// Security Middleware
app.use(helmet());
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'https://pulse.academy.alenia.io'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`CORS blocked origin: ${origin}`);
            console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body parser
app.use(express.json());

// Rate Limiting for login
const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // 5 attempts
    message: { error: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Create tables if they don't exist
const createTables = async () => {
    try {
        // Create domains table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS domains (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        color VARCHAR(50) NOT NULL
      )
    `);

        // Create users table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        domain_id INTEGER REFERENCES domains(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create news table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        domain_id INTEGER NOT NULL REFERENCES domains(id),
        content TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        archived BOOLEAN DEFAULT FALSE,
        pending_validation BOOLEAN DEFAULT FALSE
      )
    `);

        // Create subscribers table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100),
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create audit log table for connection/disconnection tracking
        await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(50) NOT NULL, -- 'login', 'logout'
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

        console.log('✅ Tables created successfully');
    } catch (err) {
        console.error('❌ Error creating tables:', err);
    }
};

// Seed database with sample data (only if empty)
const seedDatabase = async () => {
    try {
        // Check if we already have data
        const domainCount = await pool.query('SELECT COUNT(*) FROM domains');
        const newsCount = await pool.query('SELECT COUNT(*) FROM news');
        const userCount = await pool.query('SELECT COUNT(*) FROM users');

        if (parseInt(domainCount.rows[0].count) > 0 ||
            parseInt(newsCount.rows[0].count) > 0 ||
            parseInt(userCount.rows[0].count) > 0) {
            console.log('⏭️  Database already seeded, skipping...');
            return;
        }

        console.log('📝 Seeding database...');
        // Note: Use the seed-database.js script instead for full seeding
        console.log('💡 Run "node seed-database.js" to populate with sample data');

    } catch (err) {
        console.error('❌ Error seeding database:', err);
    }
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Login
app.post('/api/auth/login', loginLimiter, validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await pool.query(
            `SELECT u.*, d.name as domain_name
             FROM users u
             LEFT JOIN domains d ON u.domain_id = d.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Log the login event in audit_log
        try {
            await pool.query(
                `INSERT INTO audit_log (user_id, action, ip_address, user_agent) 
                 VALUES ($1, $2, $3, $4)`,
                [user.id, 'login', req.ip, req.get('User-Agent') || '']
            );
        } catch (auditError) {
            console.error('Failed to log login event:', auditError);
        }

        // Return user info (without password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            accessToken: accessToken
        });

    } catch (error) {
        console.error('LOGIN ERROR:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    // Log the logout event in audit_log
    try {
        pool.query(
            `INSERT INTO audit_log (user_id, action, ip_address, user_agent) 
             VALUES ($1, $2, $3, $4)`,
            [req.user.userId, 'logout', req.ip, req.get('User-Agent') || '']
        ).catch(auditError => {
            console.error('Failed to log logout event:', auditError);
        });
    } catch (error) {
        console.error('Error setting up logout audit log:', error);
    }
    
    res.json({ message: 'Logged out successfully' });
});

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const decoded = verifyRefreshToken(refreshToken);

        // Get user
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        const newAccessToken = generateAccessToken(user);

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ message: 'Token refreshed' });

    } catch (error) {
        res.status(403).json({ error: 'Invalid refresh token' });
    }
});

// Get audit logs (admin only)
app.get('/api/audit', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT al.*, u.username, u.email 
             FROM audit_log al 
             JOIN users u ON al.user_id = u.id 
             ORDER BY al.timestamp DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Check auth status
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, role, domain_id, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// DOMAIN ROUTES
// ============================================

// Get all domains (public)
app.get('/api/domains', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT d.*, COUNT(n.id) as articleCount 
             FROM domains d 
             LEFT JOIN news n ON d.id = n.domain_id 
             GROUP BY d.id 
             ORDER BY d.id`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a new domain (admin only)
app.post('/api/domains', authenticateToken, requireAdmin, validateDomainCreation, async (req, res) => {
    try {
        const { name, color } = req.body;
        const result = await pool.query(
            'INSERT INTO domains (name, color) VALUES ($1, $2) RETURNING *',
            [name, color]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Domain already exists' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Delete a domain (admin only)
app.delete('/api/domains/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Get domain name before deleting
        const domainResult = await pool.query('SELECT name FROM domains WHERE id = $1', [id]);

        if (domainResult.rows.length === 0) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        const domainName = domainResult.rows[0].name;

        // Delete associated news
        // First get the domain ID
        const domainIdResult = await pool.query('SELECT id FROM domains WHERE name = $1', [domainName]);
        if (domainIdResult.rows.length > 0) {
            await pool.query('DELETE FROM news WHERE domain_id = $1', [domainIdResult.rows[0].id]);
        }

        // Delete domain
        await pool.query('DELETE FROM domains WHERE id = $1', [id]);

        res.json({ message: 'Domain deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a domain (admin only)
app.put('/api/domains/:id', authenticateToken, requireAdmin, validateDomainCreation, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;

        const result = await pool.query(
            'UPDATE domains SET name = $1, color = $2 WHERE id = $3 RETURNING *',
            [name, color, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Domain name already exists' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// ============================================
// NEWS ROUTES
// ============================================

// Get all news (public)
app.get('/api/news', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT n.*, d.name as domain_name 
             FROM news n 
             JOIN domains d ON n.domain_id = d.id
             WHERE n.pending_validation = FALSE AND n.archived = FALSE
             ORDER BY n.date DESC`
        );
        
        // Transform the data to include domain_name and keep domain ID for consistency
        const transformedRows = result.rows.map(row => ({
            ...row,
            domain_name: row.domain_name
        }));
        
        res.json(transformedRows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Search news (public)
app.get('/api/news/search', async (req, res) => {
  try {
    const { q } = req.query;
    console.log(`[DEBUG] Search query: ${q}`);
    
    // Validate query parameter
    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const result = await pool.query(
      `SELECT n.*, d.name as domain_name 
       FROM news n 
       JOIN domains d ON n.domain_id = d.id
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.title ILIKE $1 OR n.content ILIKE $1 OR u.username ILIKE $1 
       ORDER BY date DESC`,
      [`%${q.trim()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[ERROR] Search news:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all news for admin users (domain admin and super admin)
app.get('/api/news/admin', authenticateToken, requireRole('domain_admin', 'super_admin'), async (req, res) => {
  try {
    console.log('[DEBUG] getAllNewsForAdmin called with user:', req.user);
    
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
      FROM news n 
      LEFT JOIN domains d ON n.domain_id = d.id 
      LEFT JOIN users u ON n.author_id = u.id
    `;
    
    const queryParams = [];
    
    // If user is a domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      // Check if the user has a domain_id
      const userCheckQuery = 'SELECT domain_id FROM users WHERE id = $1';
      const userResult = await pool.query(userCheckQuery, [req.user.userId]);
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        query += ` WHERE n.domain_id = $${queryParams.length + 1}`;
        queryParams.push(userResult.rows[0].domain_id);
        console.log('[DEBUG] Domain admin filter applied for domain ID:', userResult.rows[0].domain_id);
      } else {
        // If domain admin has no domain assigned, return empty result
        query += ` WHERE FALSE`;
        console.log('[DEBUG] Domain admin has no domain assigned, returning empty result');
      }
    }
    
    query += ` ORDER BY n.date DESC`;
    
    console.log('[DEBUG] Executing query:', query, 'with params:', queryParams);
    const result = await pool.query(query, queryParams);
    console.log('[DEBUG] Query returned', result.rows.length, 'rows');
    
    const transformedRows = result.rows.map(row => ({
      ...row,
      domain: row.domain_name || row.domain,
      author: row.author_name || 'Unknown',
    }));
    
    const decodedRows = transformedRows.map(item => ({
      ...item,
      content: item.content ? item.content.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : item.content,
      title: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : item.title
    }));
    
    console.log('[DEBUG] Returning', decodedRows.length, 'news items to admin user');
    res.json(decodedRows);
  } catch (err) {
    console.error('[ERROR] getAllNewsForAdmin:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get articles for a contributor
app.get('/api/news/contributor', authenticateToken, requireContributor, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name
       FROM news n 
       LEFT JOIN domains d ON n.domain_id = d.id 
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.author_id = $1
       ORDER BY n.date DESC`,
      [req.user.userId]
    );
    
    const transformedRows = result.rows.map(row => ({
        ...row,
        domain: row.domain_name || row.domain,
        author: row.author_name || 'Unknown',
    }));

    res.json(transformedRows);
  } catch (err) {
    console.error('[ERROR] getContributorNews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get archived articles
app.get('/api/news/archived', authenticateToken, requireDomainAdmin, async (req, res) => {
  try {
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name
      FROM news n 
      LEFT JOIN domains d ON n.domain_id = d.id 
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.archived = true
    `;
    const queryParams = [];

    if (req.user.role === 'domain_admin') {
      const userResult = await pool.query('SELECT domain_id FROM users WHERE id = $1', [req.user.userId]);
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        query += ` AND n.domain_id = $1`;
        queryParams.push(userResult.rows[0].domain_id);
      } else {
        query += ` AND FALSE`;
      }
    }
    query += ` ORDER BY n.date DESC`;
    const result = await pool.query(query, queryParams);
    
    const transformedRows = result.rows.map(row => ({
        ...row,
        domain: row.domain_name || row.domain,
        author: row.author_name || 'Unknown',
    }));

    res.json(transformedRows);
  } catch (err) {
    console.error('[ERROR] getArchivedNews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get articles pending validation
app.get('/api/news/pending-validation', authenticateToken, requireDomainAdmin, async (req, res) => {
  try {
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name
      FROM news n 
      LEFT JOIN domains d ON n.domain_id = d.id 
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.pending_validation = true AND n.archived = false
    `;
    const queryParams = [];

    if (req.user.role !== 'super_admin') {
      const userResult = await pool.query('SELECT domain_id FROM users WHERE id = $1', [req.user.userId]);
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        query += ` AND n.domain_id = $1`;
        queryParams.push(userResult.rows[0].domain_id);
      } else {
        query += ` AND FALSE`;
      }
    }
    query += ` ORDER BY n.date DESC`;
    const result = await pool.query(query, queryParams);

    const transformedRows = result.rows.map(row => ({
        ...row,
        domain: row.domain_name || row.domain,
        author: row.author_name || 'Unknown',
    }));
    
    res.json(transformedRows);
  } catch (err) {
    console.error('[ERROR] getPendingValidationNews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Add news (contributor or admin)
app.post('/api/news', authenticateToken, requireContributor, checkDomainAccess, validateNewsCreation, async (req, res) => {
    try {
        let { title, domain_id, content } = req.body;
        const author_id = req.user.userId;

        const result = await pool.query(
            'INSERT INTO news (title, domain_id, content, author_id, date) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *',
            [title, domain_id, content, author_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get news by ID (public)
app.get('/api/news/:id', async (req, res) => {
  console.log('[DEBUG] getNewsById function called');
  console.log('[DEBUG] getNewsById called with id:', req.params.id);
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      console.log('[DEBUG] Invalid news ID provided:', req.params.id);
      return res.status(400).json({ error: 'Invalid news ID' });
    }

    const result = await pool.query(
      `SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name
       FROM news n 
       LEFT JOIN domains d ON n.domain_id = d.id 
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    const newsItem = result.rows[0];
    const responsePayload = {
      ...newsItem,
      domain: newsItem.domain_name,
      domain_id: newsItem.domain_id,
      author: newsItem.author_name || 'Unknown',
    };
    
    res.json(responsePayload);
  } catch (err) {
    console.error('[ERROR] getNewsById:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update news
app.put('/api/news/:id', authenticateToken, requireContributor, checkDomainAccess, validateNewsCreation, async (req, res) => {
    try {
        const { id } = req.params;
        let { title, domain_id, content } = req.body;

        const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (newsResult.rows.length === 0) {
            return res.status(404).json({ error: 'News not found' });
        }
        const newsItem = newsResult.rows[0];

        const isAuthorized = req.user.role === 'super_admin' ||
                             newsItem.author_id === req.user.userId ||
                             (req.user.role === 'domain_admin' && newsItem.domain_id === req.user.domain_id);

        if (!isAuthorized) {
            return res.status(403).json({ error: 'You do not have permission to edit this article' });
        }
        
        if (req.user.role !== 'super_admin' && domain_id && domain_id !== newsItem.domain_id) {
             return res.status(403).json({ error: 'You cannot change the domain of this article.' });
        }

        const result = await pool.query(
            'UPDATE news SET title = $1, domain_id = $2, content = $3 WHERE id = $4 RETURNING *',
            [title, domain_id, content, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Grant edit access to another contributor
app.post('/api/news/:id/grant-edit', authenticateToken, requireContributor, async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;
    
    const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
    if (newsResult.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }
    const article = newsResult.rows[0];
    
    if ((req.user.role !== 'super_admin' && req.user.role !== 'domain_admin') && article.author_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only the author or an admin can grant edit access' });
    }
    
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!article.editors.includes(userEmail)) {
      const newEditors = [...article.editors, userEmail];
      await pool.query('UPDATE news SET editors = $1 WHERE id = $2', [newEditors, id]);
    }
    
    res.json({ message: `Edit access granted to ${userEmail}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Archive news
app.post('/api/news/:id/archive', authenticateToken, requireContributor, async (req, res) => {
    try {
        const { id } = req.params;
        const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (newsResult.rows.length === 0) return res.status(404).json({ error: 'News not found' });
        
        const newsItem = newsResult.rows[0];
        const isAuthorized = req.user.role === 'super_admin' || 
                             newsItem.author_id === req.user.userId ||
                             (req.user.role === 'domain_admin' && newsItem.domain_id === req.user.domain_id);

        if (!isAuthorized) return res.status(403).json({ error: 'You do not have permission to archive this article' });

        await pool.query('UPDATE news SET archived = true WHERE id = $1', [id]);
        res.json({ message: 'News archived successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Unarchive news
app.post('/api/news/:id/unarchive', authenticateToken, requireContributor, async (req, res) => {
    try {
        const { id } = req.params;
        const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (newsResult.rows.length === 0) return res.status(404).json({ error: 'News not found' });

        const newsItem = newsResult.rows[0];
        const isAuthorized = req.user.role === 'super_admin' || 
                             newsItem.author_id === req.user.userId ||
                             (req.user.role === 'domain_admin' && newsItem.domain_id === req.user.domain_id);

        if (!isAuthorized) return res.status(403).json({ error: 'You do not have permission to unarchive this article' });

        await pool.query('UPDATE news SET archived = false WHERE id = $1', [id]);
        res.json({ message: 'News unarchived successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Validate news
app.post('/api/news/:id/validate', authenticateToken, requireDomainAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the current news item
        const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (newsResult.rows.length === 0) {
            return res.status(404).json({ error: 'News article not found' });
        }
        
        const newsItem = newsResult.rows[0];
        
        // Check if user is authorized to validate this news item
        const isAuthorized = req.user.role === 'super_admin' || 
                             (req.user.role === 'domain_admin' && newsItem.domain_id === req.user.domain_id);
        
        if (!isAuthorized) {
            return res.status(403).json({ error: 'You do not have permission to validate this article' });
        }
        
        // Set pending_validation to false and record who validated it
        await pool.query(
            'UPDATE news SET pending_validation = false, validated_by = $1, validated_at = CURRENT_TIMESTAMP WHERE id = $2', 
            [req.user.userId, id]
        );
        
        res.json({ message: 'News validated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle archive status for news
app.post('/api/news/:id/toggle-archive', authenticateToken, requireDomainAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the current news item
        const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (newsResult.rows.length === 0) {
            return res.status(404).json({ error: 'News article not found' });
        }
        
        const newsItem = newsResult.rows[0];
        
        // Check if user is authorized to toggle archive status
        const isAuthorized = req.user.role === 'super_admin' || 
                             (req.user.role === 'domain_admin' && newsItem.domain_id === req.user.domain_id);
        
        if (!isAuthorized) {
            return res.status(403).json({ error: 'You do not have permission to toggle archive status for this article' });
        }
        
        // Toggle the archived status
        const newArchivedStatus = !newsItem.archived;
        await pool.query('UPDATE news SET archived = $1 WHERE id = $2', [newArchivedStatus, id]);
        
        res.json({ 
            message: `News ${newArchivedStatus ? 'archived' : 'unarchived'} successfully`,
            archived: newArchivedStatus 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete news
app.delete('/api/news/:id', authenticateToken, requireDomainAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (newsResult.rows.length === 0) return res.status(404).json({ error: 'News not found' });
        
        const newsItem = newsResult.rows[0];
        if (req.user.role === 'domain_admin' && newsItem.domain_id !== req.user.domain_id) {
            return res.status(403).json({ error: 'You can only delete articles from your own domain.'});
        }
        
        await pool.query('DELETE FROM news WHERE id = $1', [id]);
        res.json({ message: 'News deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});



// ============================================
// USER ROUTES
// ============================================

// Get all users (admin only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.email, u.role, u.domain_id, d.name as domain_name, u.created_at 
             FROM users u 
             LEFT JOIN domains d ON u.domain_id = d.id 
             ORDER BY u.id`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add user (admin only)
app.post('/api/users', authenticateToken, requireAdmin, validateUserCreation, async (req, res) => {
    try {
        let { username, email, password, role, domain_id } = req.body;

        // For contributors, domain is required
        if (role === 'contributor' && (!domain_id || domain_id.toString().trim() === '')) {
            return res.status(400).json({ error: 'Domain is required for contributors' });
        }

        if (domain_id !== undefined && domain_id !== null && domain_id.toString().trim() !== '') {
            const domainAsInt = parseInt(domain_id, 10);
            
            if (!isNaN(domainAsInt)) {
                domain_id = domainAsInt;
            } else {
                return res.status(400).json({ error: 'Invalid domain ID' });
            }
        } else {
            domain_id = null;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

        const result = await pool.query(
            'INSERT INTO users (username, email, password, role, domain_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [username, email, hashedPassword, role, domain_id]
        );

        // Fetch the created user with domain name for consistent response
        const userResult = await pool.query(
            `SELECT u.id, u.username, u.email, u.role, u.domain_id, d.name as domain_name, u.created_at 
             FROM users u 
             LEFT JOIN domains d ON u.domain_id = d.id 
             WHERE u.id = $1`,
            [result.rows[0].id]
        );

        res.json(userResult.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Update user (admin or self)
app.put('/api/users/:id', authenticateToken, validateUserUpdate, async (req, res) => {
    try {
        const { id } = req.params;
        let { username, email, role, domain_id, password } = req.body;

        // Check permissions: Admin or Self
        const isSelf = parseInt(id) === parseInt(req.user.userId);
        if (req.user.role !== 'admin' && !isSelf) {
            return res.status(403).json({ error: 'Unauthorized to update this user' });
        }

        let query = 'UPDATE users SET';
        let params = [];
        let paramIndex = 1;
        let updates = [];

        if (username !== undefined) {
            updates.push(`username = $${paramIndex++}`);
            params.push(username);
        }

        if (email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            params.push(email);
        }

        if (req.user.role === 'admin') {
            if (role !== undefined) {
                updates.push(`role = $${paramIndex++}`);
                params.push(role);
            }

            if (domain_id !== undefined) {
                 if ((role === 'contributor' || (role === undefined && req.user.role === 'contributor')) && 
                    (!domain_id || domain_id.toString().trim() === '')) {
                    return res.status(400).json({ error: 'Domain is required for contributors' });
                }

                if (domain_id !== null && domain_id.toString().trim() !== '') {
                    const domainAsInt = parseInt(domain_id, 10);
                    if (!isNaN(domainAsInt)) {
                        domain_id = domainAsInt;
                    } else {
                        return res.status(400).json({ error: 'Invalid domain ID' });
                    }
                } else {
                    if (role === 'contributor') {
                        return res.status(400).json({ error: 'Domain is required for contributors' });
                    }
                    domain_id = null;
                }

                updates.push(`domain_id = $${paramIndex++}`);
                params.push(domain_id);
            }
        }

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
            updates.push(`password = $${paramIndex++}`);
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            const userResult = await pool.query(
                `SELECT u.id, u.username, u.email, u.role, u.domain_id, d.name as domain_name, u.created_at 
                 FROM users u 
                 LEFT JOIN domains d ON u.domain_id = d.id 
                 WHERE u.id = $1`,
                [id]
            );
            
            if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
            return res.json(userResult.rows[0]);
        }

        query += ' ' + updates.join(', ');
        query += ` WHERE id = $${paramIndex} RETURNING id`;
        params.push(id);

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userResult = await pool.query(
            `SELECT u.id, u.username, u.email, u.role, u.domain_id, d.name as domain_name, u.created_at 
             FROM users u 
             LEFT JOIN domains d ON u.domain_id = d.id 
             WHERE u.id = $1`,
            [id]
        );

        res.json(userResult.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});
// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get users by domain (domain admin only)
app.get('/api/users/by-domain', authenticateToken, requireDomainAdmin, async (req, res) => {
    try {
        console.log('[DEBUG] getUsersByDomain called with user:', req.user);
        
        // Get the domain admin's assigned domain
        const userResult = await pool.query(
            'SELECT domain_id FROM users WHERE id = $1',
            [req.user.userId]
        );
        
        console.log('[DEBUG] User query result:', userResult.rows);
        
        if (userResult.rows.length === 0 || !userResult.rows[0].domain_id) {
            console.log('[DEBUG] No domain assigned to user or user not found');
            return res.status(400).json({ error: 'Domain admin not assigned to a domain' });
        }
        
        const domainId = userResult.rows[0].domain_id;
        console.log('[DEBUG] Domain ID:', domainId);
        
        // Get users in this domain (contributors and domain admins only)
        const usersResult = await pool.query(
            `SELECT u.id, u.username, u.email, u.role, u.domain_id, d.name as domain_name, u.created_at 
             FROM users u 
             LEFT JOIN domains d ON u.domain_id = d.id 
             WHERE u.domain_id = $1 AND (u.role = 'contributor' OR u.role = 'domain_admin')
             ORDER BY u.id`,
            [domainId]
        );
        
        console.log('[DEBUG] Users found:', usersResult.rows);
        res.json(usersResult.rows);
    } catch (err) {
        console.error('[ERROR] getUsersByDomain:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// SUBSCRIBER ROUTES
// ============================================
// Get all subscribers (admin only)
app.get('/api/subscribers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM subscribers ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add subscriber (public)
app.post('/api/subscribers', validateSubscriber, async (req, res) => {
    try {
        const { email, name } = req.body;
        const result = await pool.query(
            'INSERT INTO subscribers (email, name) VALUES ($1, $2) RETURNING *',
            [email, name]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Email already subscribed' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// ============================================
// UTILITY ROUTES
// ============================================

// Seed database endpoint (development only)
app.post('/api/seed', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Seeding not allowed in production' });
    }

    try {
        await seedDatabase();
        res.json({ message: 'Database seeded successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        documentation: '/api/health for health check'
    });
});

// Test route to manually trigger auto-archive (for testing purposes only)
app.get('/api/test-archive', async (req, res) => {
  try {
    console.log('🔄 Manual archive test triggered');
    
    // Archive articles older than 30 days that are not already archived
    const result = await pool.query(
      `UPDATE news 
       SET archived = true 
       WHERE date < CURRENT_DATE - INTERVAL '30 days' 
       AND archived = false 
       RETURNING id, title`
    );
    
    res.json({ 
      message: `Manual archive completed. Archived ${result.rowCount} articles.`,
      archivedArticles: result.rows
    });
    
    console.log(`✅ Manual archive completed. Archived ${result.rowCount} articles.`);
  } catch (error) {
    console.error('❌ Manual archive failed:', error);
    res.status(500).json({ error: 'Manual archive failed', details: error.message });
  }
});

// Favicon route to prevent 404 errors in browser console
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// ============================================
// SERVER STARTUP
// ============================================

// Function to find an available port
const findAvailablePort = (startPort) => {
    return new Promise((resolve, reject) => {
        const server = app.listen(startPort, '0.0.0.0', () => {
            const actualPort = server.address().port;
            console.log(`\n🚀 Server running on port ${actualPort}`);
            console.log(`🔒 Security features enabled:`);
            console.log(`   ✅ Helmet (HTTP headers security)`);
            console.log(`   ✅ CORS (${allowedOrigins.join(', ')})`);
            console.log(`   ✅ Rate limiting (${process.env.RATE_LIMIT_MAX_REQUESTS || 5} login attempts per 15 min)`);
            console.log(`   ✅ JWT authentication`);
            console.log(`   ✅ bcrypt password hashing`);
            console.log(`   ✅ Input validation\n`);
            resolve(actualPort);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${startPort} is already in use, trying ${startPort + 1}`);
                findAvailablePort(startPort + 1).then(resolve).catch(reject);
            } else {
                reject(err);
            }
        });
    });
};

// Initialize tables and start server
createTables().then(() => {
    seedDatabase().then(() => {
        // Start the auto-archive job
        startAutoArchiveJob();
        
        findAvailablePort(parseInt(port)).catch(err => {
            console.error('Failed to start server:', err);
        });
    });
});
