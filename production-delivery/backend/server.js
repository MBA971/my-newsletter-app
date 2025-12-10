import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
const startServer = async () => {
  try {
    await createTables();
    // Optional: seed database if empty/dev mode, or leave it to manual trigger
    // await seedDatabase(); 

    await findAvailablePort(parseInt(port));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();