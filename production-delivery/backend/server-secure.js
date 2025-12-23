import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Import configuration
import config from './config/config.js';
import { createTables } from './db/init.js';
import { seedDatabase } from './seed-database.js';

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

// Configure trust proxy for rate limiting when behind reverse proxy (Traefik/Nginx)
app.set('trust proxy', 1);

let port = config.port;
console.log('Server will run on port:', port);

// Security and CORS Middleware (Must be before rate limiter to ensure headers are set)
app.use(helmet());

// CORS Configuration with environment-aware settings
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  [config.frontendUrl, 'http://localhost:5173', 'http://localhost:5174', 'https://pulse.academy.alenia.io'];

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

// Rate limiting for general requests
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Request logging
app.use(morgan('combined'));

// Parse JSON and Cookies
app.use(express.json());
app.use(cookieParser());

// More specific rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_LOGIN_ATTEMPTS) || 5, // 5 login attempts
  message: {
    error: 'Too many login attempts from this IP, please try again later'
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.4.0'
  });
});

// Root route for health check and identification
app.get('/', (req, res) => {
  res.json({
    message: 'Alenia Pulse API Server',
    version: '1.4.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/health for health check'
  });
});

// Favicon route to prevent 404 errors in browser console
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Start the server
const startServer = async () => {
  try {
    // Initialize database tables
    await createTables();

    // Seed database if in development
    if (process.env.NODE_ENV === 'development') {
      await seedDatabase();
    }

    // Start the auto-archive job
    startAutoArchiveJob();

    // Import and use global error handling middleware (should be last)
    const { globalErrorHandler } = await import('./utils/errorHandler.js');
    app.use(globalErrorHandler);

    // Start the Express server
    app.listen(port, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on port ${port}`);
      console.log(`🔒 Security features enabled:`);
      console.log(`   ✅ Helmet (HTTP headers security)`);
      console.log(`   ✅ CORS (${allowedOrigins.join(', ')})`);
      console.log(`   ✅ Rate limiting (${process.env.RATE_LIMIT_MAX_REQUESTS || 1000} requests per 15 min)`);
      console.log(`   ✅ JWT authentication`);
      console.log(`   ✅ bcrypt password hashing\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();