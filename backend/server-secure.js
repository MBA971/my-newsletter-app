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
    verifyRefreshToken
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
        domain INTEGER REFERENCES domains(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create news table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        domain INTEGER NOT NULL REFERENCES domains(id),
        content TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        author_id INTEGER,
        date DATE NOT NULL DEFAULT CURRENT_DATE
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
            'SELECT * FROM users WHERE email = $1',
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
            'SELECT id, username, email, role, domain, created_at FROM users WHERE id = $1',
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
             LEFT JOIN news n ON d.id = n.domain 
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
        await pool.query('DELETE FROM news WHERE domain = $1', [domainName]);

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
             JOIN domains d ON n.domain = d.id 
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
       JOIN domains d ON n.domain = d.id 
       WHERE title ILIKE $1 OR content ILIKE $1 OR author ILIKE $1 
       ORDER BY date DESC`,
      [`%${q.trim()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[ERROR] Search news:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add news (contributor or admin)
app.post('/api/news', authenticateToken, requireContributor, checkDomainAccess, validateNewsCreation, async (req, res) => {    try {
        let { title, domain, content } = req.body;
        const author = req.user.username;

        // If contributor, force their domain
        const finalDomain = req.user.role === 'contributor' ? req.user.domain : domain;

        // Convert domain name to domain ID if domain is provided as a name
        if (finalDomain && typeof finalDomain === 'string') {
            console.log(`[DEBUG] Converting domain name '${finalDomain}' to ID`);
            const domainResult = await pool.query(
                'SELECT id FROM domains WHERE name = $1',
                [finalDomain]
            );
            console.log(`[DEBUG] Domain lookup result:`, domainResult.rows);
            if (domainResult.rows.length > 0) {
                domain = domainResult.rows[0].id;
                console.log(`[DEBUG] Converted domain to ID: ${domain}`);
            } else {
                console.log(`[DEBUG] Domain '${finalDomain}' not found, setting to null`);
                domain = null;
            }
        }

        // Ensure domain is an integer if it exists
        if (domain !== null && domain !== undefined) {
            const domainId = parseInt(domain);
            if (isNaN(domainId)) {
                return res.status(400).json({ error: 'Invalid domain ID' });
            }
            domain = domainId;
        }

        console.log(`[DEBUG] After domain conversion - domain:`, domain, `type:`, typeof domain);

        const result = await pool.query(
            'INSERT INTO news (title, domain, content, author, date) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *',
            [title, domain, content, author]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update news (contributor or admin)
app.put('/api/news/:id', authenticateToken, requireContributor, checkDomainAccess, validateNewsCreation, async (req, res) => {
    try {
        const { id } = req.params;
        let { title, domain, content } = req.body;

        console.log(`[DEBUG] News Update: User=${req.user.username} (${req.user.role}) vs Article ${id}`);

        const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        if (newsResult.rows.length === 0) {
            return res.status(404).json({ error: 'News not found' });
        }
        const newsItem = newsResult.rows[0];

        console.log(`[DEBUG] Article Author=${newsItem.author}, Domain=${newsItem.domain}`);

        // Check permissions for contributors
        if (req.user.role === 'contributor') {
            // Check if user is authorized to edit this article:
            // 1. Admin can edit any article
            // 2. Author can edit their own article (check by user ID)
            // 3. Editors can edit articles they have been granted access to
            const isAuthorized = req.user.role === 'super_admin' ||
              req.user.role === 'domain_admin' ||
              newsItem.author_id === req.user.userId ||
              (Array.isArray(newsItem.editors) && newsItem.editors.includes(req.user.email));

            if (!isAuthorized) {
                console.log(`[DEBUG] 403 Permission Denied: User ${req.user.userId} cannot edit article ${newsItem.id}`);
                return res.status(403).json({ error: 'You do not have permission to edit this article' });
            }

            // Contributors cannot change the domain
            const articleDomain = newsItem.domain; // This is already an integer
            const requestDomain = domain;

            // Note: checkDomainAccess middleware already checks if requestDomain matches user's domain
            // But we must also ensure we don't move an article OUT of our domain (if that was possible)
            if (requestDomain !== undefined && requestDomain !== null && requestDomain !== articleDomain) {
                console.log(`[DEBUG] 403 Domain Mismatch: '${requestDomain}' !== '${articleDomain}'`);
                return res.status(403).json({ error: 'You cannot change the domain' });
            }
        }

        // Handle domain conversion properly
        // First, try to parse it as an integer (ID)
        // If that fails, treat it as a domain name and look it up
        if (domain !== undefined && domain !== null) {
            console.log(`[DEBUG] Processing domain: '${domain}' (type: ${typeof domain})`);
            
            // Try to parse as integer first (assuming it's already an ID)
            const domainAsInt = parseInt(domain, 10);
            
            if (!isNaN(domainAsInt)) {
                // It's a valid integer, use it as the domain ID
                domain = domainAsInt;
                console.log(`[DEBUG] Using domain as ID: ${domain}`);
            } else if (typeof domain === 'string' && domain.trim() !== '') {
                // It's a string, try to look it up as a domain name
                console.log(`[DEBUG] Converting domain name '${domain}' to ID`);
                const domainResult = await pool.query(
                    'SELECT id FROM domains WHERE name = $1',
                    [domain.trim()]
                );
                console.log(`[DEBUG] Domain lookup result:`, domainResult.rows);
                if (domainResult.rows.length > 0) {
                    domain = domainResult.rows[0].id;
                    console.log(`[DEBUG] Converted domain to ID: ${domain}`);
                } else {
                    console.log(`[DEBUG] Domain '${domain}' not found`);
                    return res.status(400).json({ error: `Domain '${domain}' not found` });
                }
            } else {
                // Invalid domain value
                return res.status(400).json({ error: 'Invalid domain value' });
            }
        }

        console.log(`[DEBUG] After domain conversion - domain:`, domain, `type:`, typeof domain);

        const result = await pool.query(
            'UPDATE news SET title = $1, domain = $2, content = $3 WHERE id = $4 RETURNING *',
            [title, domain, content, id]
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
    const { userEmail } = req.body; // Email of user to grant edit access
    
    // Check if the article exists
    const newsResult = await pool.query(
      'SELECT * FROM news WHERE id = $1',
      [id]
    );
    
    if (newsResult.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    const article = newsResult.rows[0];
    
    // Check if current user is authorized to grant access (author or admin)
    // Use author_id for permission checking instead of username comparison
    if ((req.user.role !== 'super_admin' && req.user.role !== 'domain_admin') && article.author_id !== req.user.userId) {
      return res.status(403).json({ error: 'Only the author or admin can grant edit access' });
    }
    
    // Check if target user exists and is a contributor
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [userEmail, 'contributor']
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or not a contributor' });
    }
    
    // Add user to editors array if not already there
    if (!article.editors.includes(userEmail)) {
      const newEditors = [...article.editors, userEmail];
      await pool.query(
        'UPDATE news SET editors = $1 WHERE id = $2',
        [newEditors, id]
      );
    }
    
    res.json({ message: `Edit access granted to ${userEmail}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete news (contributor can delete their own, admin can delete any)
app.delete('/api/news/:id', authenticateToken, requireContributor, async (req, res) => {
    try {
        const { id } = req.params;

        // Get the news item
        const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);

        if (newsResult.rows.length === 0) {
            return res.status(404).json({ error: 'News not found' });
        }

        const newsItem = newsResult.rows[0];

        // Check permissions
        if (req.user.role === 'contributor') {
            // Check if user is authorized to delete this article:
            // 1. Admin can delete any article
            // 2. Author can delete their own article (check by user ID)
            // 3. Editors can delete articles they have been granted access to
            const isAuthorized = (req.user.role === 'super_admin' || req.user.role === 'domain_admin') ||
              newsItem.author_id === req.user.userId ||
              (Array.isArray(newsItem.editors) && newsItem.editors.includes(req.user.email));

            if (!isAuthorized) {
                return res.status(403).json({ error: 'You do not have permission to delete this article' });
            }
        }

        // Admin can delete any, contributor passed the check above
        await pool.query('DELETE FROM news WHERE id = $1', [id]);
        res.json({ message: 'News deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get news by ID (public)
// app.get('/api/news/:id', async (req, res) => {
//   console.log('[DEBUG] getNewsById function called');
//   console.log('[DEBUG] getNewsById called with id:', req.params.id);
//   try {
//     const id = parseInt(req.params.id);
//     
//     // Validate ID
//     if (isNaN(id)) {
//       console.log('[DEBUG] Invalid news ID provided:', req.params.id);
//       return res.status(400).json({ error: 'Invalid news ID' });
//     }
//
//     console.log('[DEBUG] Querying database for news id:', id);
//     const result = await pool.query(
//       `SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
//        FROM news n 
//        LEFT JOIN domains d ON n.domain = d.id 
//        LEFT JOIN users u ON n.author_id = u.id
//        WHERE n.id = $1`,
//       [id]
//     );
//     
//     console.log('[DEBUG] Database query result:', result.rows);
//     
//     if (result.rows.length === 0) {
//       console.log('[DEBUG] News article not found for id:', id);
//       return res.status(404).json({ error: 'News article not found' });
//     }
//     
//     // Transform the data to match the old format (domain as name instead of ID)
//     const transformedRow = {
//       id: result.rows[0].id,
//       title: result.rows[0].title,
//       domain: result.rows[0].domain_name || result.rows[0].domain, // Use domain_name if available, otherwise fallback to domain
//       content: result.rows[0].content,
//       author: result.rows[0].author_name || 'Unknown', // Use author_name from joined users table
//       author_id: result.rows[0].author_id, // Explicitly include author_id
//       date: result.rows[0].date,
//       editors: result.rows[0].editors,
//       likes_count: result.rows[0].likes_count,
//       archived: result.rows[0].archived
//     };
//     
//     // Decode HTML entities in content and title
//     const decodedRow = {
//       ...transformedRow,
//       content: transformedRow.content ? transformedRow.content.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : transformedRow.content,
//       title: transformedRow.title ? transformedRow.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : transformedRow.title
//     };
//     
//     console.log('[DEBUG] Returning news item:', decodedRow);
//     res.json(decodedRow);
//   } catch (err) {
//     console.error('[ERROR] getNewsById:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

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
             JOIN domains d ON n.domain = d.id 
             WHERE title ILIKE $1 OR content ILIKE $1 OR author ILIKE $1 
             ORDER BY date DESC`,
            [`%${q.trim()}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[ERROR] Search news:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// NEW ADMIN/CONTRIBUTOR NEWS ROUTES
// ============================================

// Get all news for admin users (domain admin and super admin)
app.get('/api/news/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('[DEBUG] getAllNewsForAdmin called with user:', req.user);
    
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
      FROM news n 
      LEFT JOIN domains d ON n.domain = d.id 
      LEFT JOIN users u ON n.author_id = u.id
    `;
    
    const queryParams = [];
    
    // If user is a domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      // Check if the user has a domain_id
      const userCheckQuery = 'SELECT domain_id FROM users WHERE id = $1';
      const userResult = await pool.query(userCheckQuery, [req.user.userId]);
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        query += ` WHERE n.domain = $${queryParams.length + 1}`;
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
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      domain: row.domain_name || row.domain, // Use domain_name if available, otherwise fallback to domain
      content: row.content,
      author: row.author_name || 'Unknown', // Use author_name from joined users table
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived,
      pending_validation: row.pending_validation
    }));
    
    // Decode HTML entities in content and title
    // Assuming decodeNewsContent function exists or implementing inline
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

// Get articles for a contributor (all articles by that contributor)
app.get('/api/news/contributor', authenticateToken, requireContributor, async (req, res) => {
  try {
    console.log('[DEBUG] getContributorNews called with user:', req.user);
    
    const result = await pool.query(
      `SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
       FROM news n 
       LEFT JOIN domains d ON n.domain = d.id 
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.author_id = $1
       ORDER BY n.date DESC`,
      [req.user.userId]
    );
    
    console.log('[DEBUG] Query returned', result.rows.length, 'rows');
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      domain: row.domain_name || row.domain, // Use domain_name if available, otherwise fallback to domain
      content: row.content,
      author: row.author_name || 'Unknown', // Use author_name from joined users table
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived,
      pending_validation: row.pending_validation
    }));
    
    // Decode HTML entities in content and title
    const decodedRows = transformedRows.map(item => ({
      ...item,
      content: item.content ? item.content.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : item.content,
      title: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : item.title
    }));
    
    console.log('[DEBUG] Returning', decodedRows.length, 'news items to contributor');
    res.json(decodedRows);
  } catch (err) {
    console.error('[ERROR] getContributorNews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get archived articles (admin only)
app.get('/api/news/archived', authenticateToken, requireDomainAdmin, async (req, res) => {
  console.log('[DEBUG] getArchivedNews function called');
  try {
    console.log('[DEBUG] getArchivedNews called with user:', req.user);
    
    // Super admins can view all archived articles
    // Domain admins can view archived articles in their domain
    if (req.user.role !== 'super_admin' && req.user.role !== 'domain_admin') {
      return res.status(403).json({ error: 'Only administrators can view archived articles' });
    }
    
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
      FROM news n 
      LEFT JOIN domains d ON n.domain = d.id 
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.archived = true
    `;
    
    const queryParams = [];
    
    // If user is a domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      // Check if the user has a domain_id
      const userCheckQuery = 'SELECT domain_id FROM users WHERE id = $1';
      console.log('[DEBUG] Checking user domain with query:', userCheckQuery, 'and userId:', req.user.userId);
      const userResult = await pool.query(userCheckQuery, [req.user.userId]);
      console.log('[DEBUG] User check result:', userResult.rows);
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        query += ` AND n.domain = $${queryParams.length + 1}`;
        queryParams.push(userResult.rows[0].domain_id);
        console.log('[DEBUG] Domain admin filter applied for domain ID:', userResult.rows[0].domain_id);
      } else {
        // If domain admin has no domain assigned, return empty result
        query += ` AND FALSE`;
        console.log('[DEBUG] Domain admin has no domain assigned, returning empty result');
      }
    }
    
    query += ` ORDER BY n.date DESC`;
    
    console.log('[DEBUG] Final query:', query);
    console.log('[DEBUG] Final params:', queryParams);
    const result = await pool.query(query, queryParams);
    console.log('[DEBUG] Query returned', result.rows.length, 'rows');
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      domain: row.domain_name || row.domain, // Use domain_name if available, otherwise fallback to domain
      content: row.content,
      author: row.author_name || 'Unknown', // Use author_name from joined users table
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived
    }));
    
    // Decode HTML entities in content and title
    const decodedRows = transformedRows.map(item => ({
      ...item,
      content: item.content ? item.content.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : item.content,
      title: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : item.title
    }));
    
    console.log('[DEBUG] Returning', decodedRows.length, 'archived news items');
    res.json(decodedRows);
  } catch (err) {
    console.error('[ERROR] getArchivedNews:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get articles pending validation (admin only)
app.get('/api/news/pending-validation', authenticateToken, requireDomainAdmin, async (req, res) => {
  console.log('[DEBUG] getPendingValidationNews function called');
  try {
    console.log('[DEBUG] getPendingValidationNews called with user:', req.user);
    
    let query = `
      SELECT n.*, d.id as domain_id, d.name as domain_name, u.username as author_name, n.likes_count
      FROM news n 
      LEFT JOIN domains d ON n.domain = d.id 
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.pending_validation = true AND n.archived = false
    `;

    const queryParams = [];

    // If user is not a super admin, filter by domain
    if (req.user.role !== 'super_admin') {
      // Check if the user has a domain_id
      const userCheckQuery = 'SELECT domain_id FROM users WHERE id = $1';
      console.log('[DEBUG] Checking user domain with query:', userCheckQuery, 'and userId:', req.user.userId);
      const userResult = await pool.query(userCheckQuery, [req.user.userId]);
      console.log('[DEBUG] User check result:', userResult.rows);
      
      if (userResult.rows.length > 0 && userResult.rows[0].domain_id) {
        query += ` AND n.domain = $${queryParams.length + 1}`;
        queryParams.push(userResult.rows[0].domain_id);
        console.log('[DEBUG] Domain filter applied for domain ID:', userResult.rows[0].domain_id);
      } else {
        // If user has no domain assigned, return empty result
        query += ` AND FALSE`;
        console.log('[DEBUG] User has no domain assigned, returning empty result');
      }
    }

    query += ` ORDER BY n.date DESC`;

    console.log('[DEBUG] Final query:', query);
    console.log('[DEBUG] Final params:', queryParams);
    const result = await pool.query(query, queryParams);
    console.log('[DEBUG] Query returned', result.rows.length, 'rows');

    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      domain: row.domain_name || row.domain, // Use domain_name if available, otherwise fallback to domain
      content: row.content,
      author: row.author_name || 'Unknown', // Use author_name from joined users table
      author_id: row.author_id, // Explicitly include author_id
      date: row.date,
      editors: row.editors,
      likes_count: row.likes_count,
      archived: row.archived,
      pending_validation: row.pending_validation
    }));

    // Decode HTML entities in content and title
    const decodedRows = transformedRows.map(item => ({
      ...item,
      content: item.content ? item.content.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : item.content,
      title: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : item.title
    }));

    console.log('[DEBUG] Returning', decodedRows.length, 'pending validation news items');
    res.json(decodedRows);
  } catch (err) {
    console.error('[ERROR] getPendingValidationNews:', err);
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
        let { username, email, password, role, domain } = req.body;

        // For contributors, domain is required
        if (role === 'contributor' && (!domain || domain.toString().trim() === '')) {
            return res.status(400).json({ error: 'Domain is required for contributors' });
        }

        // Handle domain conversion properly
        // First, try to parse it as an integer (ID)
        // If that fails, treat it as a domain name and look it up
        if (domain !== undefined && domain !== null && domain.toString().trim() !== '') {
            console.log(`[DEBUG] Processing domain: '${domain}' (type: ${typeof domain})`);
            
            // Try to parse as integer first (assuming it's already an ID)
            const domainAsInt = parseInt(domain, 10);
            
            if (!isNaN(domainAsInt)) {
                // It's a valid integer, use it as the domain ID
                domain = domainAsInt;
                console.log(`[DEBUG] Using domain as ID: ${domain}`);
            } else if (typeof domain === 'string' && domain.trim() !== '') {
                // It's a string, try to look it up as a domain name
                console.log(`[DEBUG] Converting domain name '${domain}' to ID`);
                const domainResult = await pool.query(
                    'SELECT id FROM domains WHERE name = $1',
                    [domain.trim()]
                );
                console.log(`[DEBUG] Domain lookup result:`, domainResult.rows);
                if (domainResult.rows.length > 0) {
                    domain = domainResult.rows[0].id;
                    console.log(`[DEBUG] Converted domain to ID: ${domain}`);
                } else {
                    console.log(`[DEBUG] Domain '${domain}' not found`);
                    return res.status(400).json({ error: `Domain '${domain}' not found` });
                }
            } else {
                // Invalid domain value
                return res.status(400).json({ error: 'Invalid domain value' });
            }
        } else {
            // If no domain provided or empty, set to null (for non-contributors)
            domain = null;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

        const result = await pool.query(
            'INSERT INTO users (username, email, password, role, domain_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [username, email, hashedPassword, role, domain]
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
        let { username, email, role, domain, password } = req.body;

        // Check permissions: Admin or Self
        const isSelf = parseInt(id) === parseInt(req.user.userId);
        if (req.user.role !== 'admin' && !isSelf) {
            return res.status(403).json({ error: 'Unauthorized to update this user' });
        }

        // For contributors, domain is required
        // If role is being updated to contributor, domain must be provided
        if (role === 'contributor' && (!domain || domain.toString().trim() === '')) {
            return res.status(400).json({ error: 'Domain is required for contributors' });
        }

        // Handle domain conversion properly
        // First, try to parse it as an integer (ID)
        // If that fails, treat it as a domain name and look it up
        if (domain !== undefined && domain !== null && domain.toString().trim() !== '') {
            console.log(`[DEBUG] Processing domain: '${domain}' (type: ${typeof domain})`);
            
            // Try to parse as integer first (assuming it's already an ID)
            const domainAsInt = parseInt(domain, 10);
            
            if (!isNaN(domainAsInt)) {
                // It's a valid integer, use it as the domain ID
                domain = domainAsInt;
                console.log(`[DEBUG] Using domain as ID: ${domain}`);
            } else if (typeof domain === 'string' && domain.trim() !== '') {
                // It's a string, try to look it up as a domain name
                console.log(`[DEBUG] Converting domain name '${domain}' to ID`);
                const domainResult = await pool.query(
                    'SELECT id FROM domains WHERE name = $1',
                    [domain.trim()]
                );
                console.log(`[DEBUG] Domain lookup result:`, domainResult.rows);
                if (domainResult.rows.length > 0) {
                    domain = domainResult.rows[0].id;
                    console.log(`[DEBUG] Converted domain to ID: ${domain}`);
                } else {
                    console.log(`[DEBUG] Domain '${domain}' not found`);
                    return res.status(400).json({ error: `Domain '${domain}' not found` });
                }
            } else {
                // Invalid domain value
                return res.status(400).json({ error: 'Invalid domain value' });
            }
        } else if (role === 'contributor') {
            // If role is contributor but no valid domain provided
            return res.status(400).json({ error: 'Domain is required for contributors' });
        } else {
            // If no domain provided or empty, set to null (for non-contributors)
            domain = null;
        }

        let query = 'UPDATE users SET username = $1, email = $2';
        let params = [username, email];
        let paramIndex = 3;

        // Only admin can update role and domain
        if (req.user.role === 'admin') {
            query += `, role = $${paramIndex++}, domain_id = $${paramIndex++}`
            params.push(role, domain);
        }

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
            query += `, password = $${paramIndex++}`;
            params.push(hashedPassword);
        }

        query += ` WHERE id = $${paramIndex} RETURNING id`;
        params.push(id);

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch the updated user with domain name for consistent response
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
