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
    checkDomainAccess,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from './middleware/auth.js';
import {
    validateLogin,
    validateUserCreation,
    validateNewsCreation,
    validateDomainCreation,
    validateSubscriber
} from './middleware/validators.js';

dotenv.config();

const app = express();
// Configure trust proxy for rate limiting when behind reverse proxy (Traefik)
app.set('trust proxy', 1);
let port = process.env.PORT || 3002;

// Security Middleware
app.use(helmet());
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
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
        name VARCHAR(100) NOT NULL,
        color VARCHAR(50) NOT NULL
      )
    `);

        // Create news table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        domain VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE
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
        domain VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', email);
        console.log('Password (length):', password.length);
        console.log('Password has leading/trailing whitespace:', password !== password.trim());
        console.log('Request IP:', req.ip);
        console.log('User-Agent:', req.get('User-Agent'));
        console.log('Timestamp:', new Date().toISOString());

        // Find user
        console.log('Querying database for user...');
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        console.log('Database query result count:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('❌ USER NOT FOUND - Returning 401');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log('User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            password_hash_length: user.password.length
        });

        // Verify password
        console.log('Verifying password...');
        console.log('Password before trim:', JSON.stringify(password));
        const trimmedPassword = password.trim();
        console.log('Password after trim:', JSON.stringify(trimmedPassword));
        
        const isValid = await bcrypt.compare(trimmedPassword, user.password);
        console.log('Password verification result:', isValid);

        if (!isValid) {
            console.log('❌ INVALID PASSWORD - Returning 401');
            // Let's also try with the original password to see if that works
            const isValidOriginal = await bcrypt.compare(password, user.password);
            console.log('Original password verification result:', isValidOriginal);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('✅ Password verified successfully');
        
        // Log JWT configuration
        console.log('JWT Configuration:');
        console.log('- JWT_SECRET length:', (process.env.JWT_SECRET || '').length);
        console.log('- JWT_REFRESH_SECRET length:', (process.env.JWT_REFRESH_SECRET || '').length);
        console.log('- NODE_ENV:', process.env.NODE_ENV);

        // Generate tokens
        console.log('Generating access token...');
        const accessToken = generateAccessToken(user);
        console.log('Access token generated, length:', accessToken.length);

        console.log('Generating refresh token...');
        const refreshToken = generateRefreshToken(user);
        console.log('Refresh token generated, length:', refreshToken.length);

        // Set cookies
        console.log('Setting cookies...');
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

        // Return user info (without password)
        const { password: _, ...userWithoutPassword } = user;
        console.log('✅ LOGIN SUCCESSFUL - Sending response');
        res.json({
            message: 'Login successful',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('❌ LOGIN ERROR:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
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
        const result = await pool.query('SELECT * FROM domains ORDER BY id');
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

// ============================================
// NEWS ROUTES
// ============================================

// Get all news (public)
app.get('/api/news', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM news ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add news (contributor or admin)
app.post('/api/news', authenticateToken, requireContributor, checkDomainAccess, validateNewsCreation, async (req, res) => {
    try {
        const { title, domain, content } = req.body;
        const author = req.user.username;

        // If contributor, force their domain
        const finalDomain = req.user.role === 'contributor' ? req.user.domain : domain;

        const result = await pool.query(
            'INSERT INTO news (title, domain, content, author, date) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *',
            [title, finalDomain, content, author]
        );
        res.json(result.rows[0]);
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
            // Contributors can only delete their own articles in their domain
            if (newsItem.author !== req.user.username || newsItem.domain !== req.user.domain) {
                return res.status(403).json({ error: 'You can only delete your own articles in your domain' });
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

// Search news (public)
app.get('/api/news/search', async (req, res) => {
    try {
        const { q } = req.query;
        const result = await pool.query(
            `SELECT * FROM news WHERE title ILIKE $1 OR content ILIKE $1 OR author ILIKE $1 ORDER BY date DESC`,
            [`%${q}%`]
        );
        res.json(result.rows);
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
        const result = await pool.query('SELECT id, username, email, role, domain, created_at FROM users ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add user (admin only)
app.post('/api/users', authenticateToken, requireAdmin, validateUserCreation, async (req, res) => {
    try {
        const { username, email, password, role, domain } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

        const result = await pool.query(
            'INSERT INTO users (username, email, password, role, domain) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, domain, created_at',
            [username, email, hashedPassword, role, domain]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, domain } = req.body;

        const result = await pool.query(
            'UPDATE users SET username = $1, email = $2, role = $3, domain = $4 WHERE id = $5 RETURNING id, username, email, role, domain, created_at',
            [username, email, role, domain, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route for health check and identification
app.get('/', (req, res) => {
    res.json({
        message: 'Alenia Pulse API Server',
        version: '1.2.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        documentation: '/api/health for health check'
    });
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
        findAvailablePort(parseInt(port)).catch(err => {
            console.error('Failed to start server:', err);
        });
    });
});
