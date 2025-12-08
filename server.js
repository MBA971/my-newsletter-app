import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './middleware/auth.js';
import { requireRole, authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
// Start from port 3000 and find available port
let port = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5174', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

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
        domain VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        editors TEXT[] DEFAULT '{}', -- Store emails of users who can edit this article
        FOREIGN KEY (domain) REFERENCES domains(name)
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

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

// Seed database with sample data
const seedDatabase = async () => {
  try {
    // Check if we already have data
    const domainCount = await pool.query('SELECT COUNT(*) FROM domains');
    const newsCount = await pool.query('SELECT COUNT(*) FROM news');
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    
    if (parseInt(domainCount.rows[0].count) > 0 || 
        parseInt(newsCount.rows[0].count) > 0 || 
        parseInt(userCount.rows[0].count) > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    // Insert sample domains
    const domains = [
      { name: 'Technology', color: '#3b82f6' },      // Blue
      { name: 'Business', color: '#22c55e' },        // Green
      { name: 'Design', color: '#a855f7' },          // Purple
      { name: 'Culture', color: '#f97316' },         // Orange
      { name: 'Science', color: '#ef4444' }          // Red
    ];

    console.log('  📁 Inserting domains...');
    for (const domain of domains) {
      await pool.query(
        'INSERT INTO domains (name, color) VALUES ($1, $2)',
        [domain.name, domain.color]
      );
    }

    // Insert sample users with bcrypt hashed passwords
    const users = [
      { username: 'tech_contributor', email: 'tech@company.com', password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', role: 'contributor', domain: 'Technology' }, // tech123
      { username: 'business_contributor', email: 'business@company.com', password: '$2b$12$IuOYa/0K7Chf.ZbK4.0EIuBbEyqDLs1wDBg7Hu8Sf0s0p6rdFm.HS', role: 'contributor', domain: 'Business' }, // business123
      { username: 'design_contributor', email: 'design@company.com', password: '$2b$12$r1K/.F0HcjDXXA/SOFTRu.1Hq8RYxyHNLw84U6MCHB5GO4NszCxjW', role: 'contributor', domain: 'Design' }, // design123
      { username: 'culture_contributor', email: 'culture@company.com', password: '$2b$12$U0G49hBD1qDE8bGS/sDcdeR5mo0oOjiKspX6jHwH9cGP7nQOKUuja', role: 'contributor', domain: 'Culture' }, // culture123
      { username: 'science_contributor', email: 'science@company.com', password: '$2b$12$s/JMO64.z0OMQgMCbHdHOupkyjsnyF8PoF5Hf5YYqEvJE5NGuoHcq', role: 'contributor', domain: 'Science' }, // science123
      { username: 'admin', email: 'admin@company.com', password: '$2b$12$nL/yH5uF25EO8xppFqzYkeubscnT651HE.tUJdKYXLn7Fxd5f0wQG', role: 'admin', domain: null }, // admin123
      { username: 'user1', email: 'user1@company.com', password: '$2b$12$cwGnpqf.et9d1ZPog9.BweijrrjKX5uVMGBj6LQxODR/Va7RyCB0y', role: 'user', domain: null }, // user123
      { username: 'user2', email: 'user2@company.com', password: '$2b$12$cwGnpqf.et9d1ZPog9.BweijrrjKX5uVMGBj6LQxODR/Va7RyCB0y', role: 'user', domain: null } // user123
    ];

    console.log('  👤 Inserting users...');
    for (const user of users) {
      await pool.query(
        'INSERT INTO users (username, email, password, role, domain) VALUES ($1, $2, $3, $4, $5)',
        [user.username, user.email, user.password, user.role, user.domain]
      );
    }

    // Insert sample subscribers
    const subscribers = [
      { email: 'subscriber1@example.com', name: 'John Doe' },
      { email: 'subscriber2@example.com', name: 'Jane Smith' },
      { email: 'subscriber3@example.com', name: 'Robert Johnson' },
      { email: 'subscriber4@example.com', name: 'Emily Davis' },
      { email: 'subscriber5@example.com', name: 'Michael Wilson' }
    ];

    console.log('  📧 Inserting subscribers...');
    for (const subscriber of subscribers) {
      await pool.query(
        'INSERT INTO subscribers (email, name) VALUES ($1, $2)',
        [subscriber.email, subscriber.name]
      );
    }

    // Insert sample news articles for each domain
    const news = [
      {
        title: 'New AI Breakthrough in Natural Language Processing',
        domain: 'Technology',
        content: 'Researchers have developed a new AI model that significantly improves natural language understanding. The model shows 40% better performance on benchmark tests compared to previous versions.',
        author: 'tech_contributor'
      },
      {
        title: 'Revolutionary Battery Technology Promises Week-Long Charge',
        domain: 'Technology',
        content: 'Scientists have announced a breakthrough in battery technology that could keep devices charged for up to a week. The new solid-state batteries are also safer and charge faster than current lithium-ion technology.',
        author: 'tech_contributor'
      },
      {
        title: 'Global Markets Reach All-Time High Amid Economic Recovery',
        domain: 'Business',
        content: 'Stock markets worldwide have reached unprecedented levels as economic indicators show strong recovery signals. Analysts predict continued growth through the next quarter.',
        author: 'business_contributor'
      },
      {
        title: 'Startup Funding Reaches Record Levels in Q3',
        domain: 'Business',
        content: 'Venture capital investments hit a new quarterly record, with over $50 billion invested in startups globally. The technology sector continues to attract the largest share of funding.',
        author: 'business_contributor'
      },
      {
        title: 'Minimalist Design Trends Take Over Modern Architecture',
        domain: 'Design',
        content: 'Architects are embracing minimalist principles, focusing on clean lines and sustainable materials. This trend is reshaping urban landscapes worldwide.',
        author: 'design_contributor'
      },
      {
        title: 'Color Theory Innovations in Digital Media',
        domain: 'Design',
        content: 'New research in color theory is influencing digital design practices, leading to more accessible and emotionally resonant user interfaces.',
        author: 'design_contributor'
      },
      {
        title: 'Cultural Exchange Programs See Surge in Participation',
        domain: 'Culture',
        content: 'International cultural exchange programs report a 40% increase in participants this year, fostering greater global understanding and cooperation.',
        author: 'culture_contributor'
      },
      {
        title: 'Digital Art Galleries Transform Museum Experience',
        domain: 'Culture',
        content: 'Museums worldwide are adopting virtual reality galleries, making art accessible to global audiences and creating immersive experiences.',
        author: 'culture_contributor'
      },
      {
        title: 'Discovery of New Exoplanet with Potential for Life',
        domain: 'Science',
        content: 'Astronomers have identified a new exoplanet in the habitable zone of its star system. Initial analysis suggests it may have conditions suitable for life as we know it.',
        author: 'science_contributor'
      },
      {
        title: 'Breakthrough in Quantum Computing Achieved',
        domain: 'Science',
        content: 'Scientists have successfully demonstrated quantum supremacy with a new processor that solves complex problems in minutes that would take traditional computers thousands of years.',
        author: 'science_contributor'
      }
    ];

    console.log('  📰 Inserting news articles...');
    for (const article of news) {
      await pool.query(
        'INSERT INTO news (title, domain, content, author, date) VALUES ($1, $2, $3, $4, CURRENT_DATE - CAST(RANDOM()*30 AS INTEGER))',
        [article.title, article.domain, article.content, article.author]
      );
    }

    console.log('Database seeded with sample data');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

// Authentication Routes

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const userResult = await pool.query(
      'SELECT id, username, email, password, role, domain FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Log the login action for audit
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await pool.query(
      'INSERT INTO audit_log (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [user.id, 'login', ipAddress, req.headers['user-agent'] || 'Unknown']
    );
    
    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'lax'
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    });
    
    // Send response with user data (excluding password)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      domain: user.domain
    };
    
    res.json({
      message: 'Login successful',
      user: userData,
      accessToken: accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    // Log the logout action for audit
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await pool.query(
      'INSERT INTO audit_log (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [req.user.userId, 'logout', ipAddress, req.headers['user-agent'] || 'Unknown']
    );
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token route
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const userResult = await pool.query(
      'SELECT id, username, email, role, domain FROM users WHERE id = $1 AND email = $2',
      [decoded.userId, decoded.email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    const user = userResult.rows[0];
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// API Routes

// Get all domains
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
app.post('/api/domains', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, color } = req.body;
    const result = await pool.query(
      'INSERT INTO domains (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a domain (admin only)
app.put('/api/domains/:id', authenticateToken, requireRole('admin'), async (req, res) => {
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a domain (admin only)
app.delete('/api/domains/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM domains WHERE id = $1', [id]);
    // Also delete associated news
    await pool.query('DELETE FROM news WHERE domain = (SELECT name FROM domains WHERE id = $1)', [id]);
    res.json({ message: 'Domain deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all news
app.get('/api/news', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add news (contributors and admin)
app.post('/api/news', authenticateToken, requireRole('contributor', 'admin'), async (req, res) => {
  try {
    const { title, domain, content } = req.body;
    const author = req.user.username;
    
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

// Update news (owner, editors, or admin)
app.put('/api/news/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, domain, content } = req.body;
    
    // Check if user can edit this article
    const newsResult = await pool.query(
      'SELECT * FROM news WHERE id = $1',
      [id]
    );
    
    if (newsResult.rows.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    const article = newsResult.rows[0];
    
    // Check permissions:
    // 1. Admin can edit any article
    // 2. Author can edit their own article
    // 3. Editors can edit articles they have been granted access to
    const isAuthorized = req.user.role === 'admin' || 
                         article.author === req.user.username || 
                         article.editors.includes(req.user.email);
    
    if (!isAuthorized) {
      return res.status(403).json({ error: 'You do not have permission to edit this article' });
    }
    
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
app.post('/api/news/:id/grant-edit', authenticateToken, requireRole('contributor', 'admin'), async (req, res) => {
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
    if (req.user.role !== 'admin' && article.author !== req.user.username) {
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

// Delete news (owner or admin)
app.delete('/api/news/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM news WHERE id = $1', [id]);
    res.json({ message: 'News deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search news
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

// Get all users (admin only)
app.get('/api/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, domain, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add user (admin only)
app.post('/api/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, role, domain } = req.body;
    
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, domain) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, hashedPassword, role, domain]
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = result.rows[0];
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, domain } = req.body;
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, role = $3, domain = $4 WHERE id = $5 RETURNING *',
      [username, email, role, domain, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = result.rows[0];
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all subscribers (admin only)
app.get('/api/subscribers', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscribers ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add subscriber
app.post('/api/subscribers', authenticateToken, async (req, res) => {
  try {
    const { email, name } = req.body;
    const result = await pool.query(
      'INSERT INTO subscribers (email, name) VALUES ($1, $2) RETURNING *',
      [email, name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete subscriber (admin only)
app.delete('/api/subscribers/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM subscribers WHERE id = $1', [id]);
    res.json({ message: 'Subscriber deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Audit log routes (admin only)
app.get('/api/audit', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        audit_log.*, 
        users.username, 
        users.email 
      FROM audit_log 
      JOIN users ON audit_log.user_id = users.id 
      ORDER BY audit_log.timestamp DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Seed database endpoint
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ message: 'Database seeded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Function to find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(startPort, '0.0.0.0', () => {
      const actualPort = server.address().port;
      console.log(`Server running on port ${actualPort}`);
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

// Initialize tables and start server with dynamic port assignment
createTables().then(() => {
  seedDatabase().then(() => {
    findAvailablePort(parseInt(port)).catch(err => {
      console.error('Failed to start server:', err);
    });
  });
});