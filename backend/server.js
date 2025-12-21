import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
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

// Import cache utility to initialize it
import cache from './utils/cache.js';

const app = express();
let port = config.port;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// More specific rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Routes
app.use('/api/domains', domainsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/audit', auditRoutes);

// Apply auth limiter specifically to auth routes
app.use('/api/auth', authLimiter, authRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Test route to manually trigger auto-archive (for testing purposes only)
app.get('/api/test-archive', async (req, res, next) => {
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
    next(error); // Pass error to global error handler
  }
});

// Seed database endpoint
app.post('/api/seed', async (req, res, next) => {
  try {
    await seedDatabase();
    res.json({ message: 'Database seeded successfully' });
  } catch (err) {
    next(err); // Pass error to global error handler
  }
});

// Start the server
const startServer = async () => {
  try {
    // Initialize database tables
    await createTables();

    // Start the auto-archive job
    startAutoArchiveJob();

    // Import and use global error handling middleware (should be last)
    const { globalErrorHandler } = await import('./utils/errorHandler.js');
    app.use(globalErrorHandler);

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