import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/config.js';
import { createTables } from './db/init.js';
import { seedDatabase } from './seed-database.js';
import pool from './utils/database.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import domainsRoutes from './routes/domains.routes.js';
import newsRoutes from './routes/news.routes.js';
import usersRoutes from './routes/users.routes.js';
import subscribersRoutes from './routes/subscribers.routes.js';
import auditRoutes from './routes/audit.routes.js';

// Import jobs
import { startAutoArchiveJob } from './jobs/auto-archive.js';

const app = express();
let port = config.port;

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/domains', domainsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/audit', auditRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
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

// Seed database endpoint
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ message: 'Database seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const startServer = async () => {
  try {
    // Initialize database tables
    await createTables();
    
    // Start the auto-archive job
    startAutoArchiveJob();
    
    // Start the Express server
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();