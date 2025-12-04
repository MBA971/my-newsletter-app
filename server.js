import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
let port = process.env.PORT || 3002;

// Middleware
app.use(cors());
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
      { name: 'Technology', color: 'bg-blue-500' },
      { name: 'Business', color: 'bg-green-500' },
      { name: 'Design', color: 'bg-purple-500' },
      { name: 'Culture', color: 'bg-orange-500' },
      { name: 'Science', color: 'bg-red-500' }
    ];

    for (const domain of domains) {
      await pool.query(
        'INSERT INTO domains (name, color) VALUES ($1, $2)',
        [domain.name, domain.color]
      );
    }

    // Insert sample users with correct roles
    const users = [
      { username: 'tech_contributor', email: 'tech@company.com', password: 'tech123', role: 'contributor', domain: 'Technology' },
      { username: 'business_contributor', email: 'business@company.com', password: 'business123', role: 'contributor', domain: 'Business' },
      { username: 'design_contributor', email: 'design@company.com', password: 'design123', role: 'contributor', domain: 'Design' },
      { username: 'culture_contributor', email: 'culture@company.com', password: 'culture123', role: 'contributor', domain: 'Culture' },
      { username: 'science_contributor', email: 'science@company.com', password: 'science123', role: 'contributor', domain: 'Science' },
      { username: 'admin', email: 'admin@company.com', password: 'admin123', role: 'admin', domain: null },
      { username: 'user1', email: 'user1@company.com', password: 'user123', role: 'user', domain: null },
      { username: 'user2', email: 'user2@company.com', password: 'user123', role: 'user', domain: null }
    ];

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
        title: 'Revolutionary Quantum Computing Chip Announced',
        domain: 'Technology',
        content: 'A breakthrough in quantum computing has been achieved with a new chip that can perform calculations 100 times faster than current processors. This could revolutionize fields from cryptography to drug discovery.',
        author: 'tech_contributor'
      },
      {
        title: 'Company Expansion to European Markets',
        domain: 'Business',
        content: 'We are excited to announce our expansion into European markets. New offices will open in London, Paris, and Berlin by the end of the year, creating over 200 new jobs.',
        author: 'business_contributor'
      },
      {
        title: 'Quarterly Financial Results Exceed Expectations',
        domain: 'Business',
        content: 'Our Q3 results show strong growth across all sectors. Revenue increased by 25% compared to last year, and we\'ve exceeded our profitability targets for the second consecutive quarter.',
        author: 'business_contributor'
      },
      {
        title: 'Redesigning Our Brand Identity',
        domain: 'Design',
        content: 'Our design team has been working hard to refresh our brand identity. The new look will be unveiled at our annual conference next month. Stay tuned for exciting updates!',
        author: 'design_contributor'
      },
      {
        title: 'New Collaboration Tools for Remote Teams',
        domain: 'Design',
        content: 'We\'ve partnered with leading software companies to bring you enhanced collaboration tools. These new features will improve productivity and communication for remote teams.',
        author: 'design_contributor'
      },
      {
        title: 'Employee Spotlight: Meet Our Engineering Team',
        domain: 'Culture',
        content: 'This month we\'re highlighting our amazing engineering team. Learn about their projects, challenges, and what makes them passionate about technology and innovation.',
        author: 'culture_contributor'
      },
      {
        title: 'New Wellness Program Launches Company-Wide',
        domain: 'Culture',
        content: 'Starting next month, all employees will have access to our new wellness program, including mental health resources, fitness classes, and nutrition counseling.',
        author: 'culture_contributor'
      },
      {
        title: 'Breakthrough in Renewable Energy Storage',
        domain: 'Science',
        content: 'Scientists have made a significant discovery in battery technology that could revolutionize renewable energy storage. The new method increases efficiency by 60% while reducing costs.',
        author: 'science_contributor'
      },
      {
        title: 'Discovery of New Exoplanet with Potential for Life',
        domain: 'Science',
        content: 'Astronomers have identified a new exoplanet in the habitable zone of its star system. Initial analysis suggests it may have conditions suitable for life as we know it.',
        author: 'science_contributor'
      }
    ];

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

// Add a new domain
app.post('/api/domains', async (req, res) => {
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

// Delete a domain
app.delete('/api/domains/:id', async (req, res) => {
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

// Add news
app.post('/api/news', async (req, res) => {
  try {
    const { title, domain, content, author } = req.body;
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

// Delete news
app.delete('/api/news/:id', async (req, res) => {
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

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, domain, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add user (admin only)
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role, domain } = req.body;
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, domain) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, password, role, domain]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only)
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, domain } = req.body;
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, role = $3, domain = $4 WHERE id = $5 RETURNING *',
      [username, email, role, domain, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all subscribers
app.get('/api/subscribers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscribers ORDER BY id');
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