import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import pool from './utils/database.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import domainsRoutes from './routes/domains.routes.js';
import newsRoutes from './routes/news.routes.js';
import usersRoutes from './routes/users.routes.js';
import subscribersRoutes from './routes/subscribers.routes.js';
import auditRoutes from './routes/audit.routes.js';

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

// Using shared database connection from utils/database.js

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/domains', domainsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/audit', auditRoutes);

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