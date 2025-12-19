import { Pool } from 'pg';
import config from './config/config.js';

// Create a single database connection pool to be reused
const pool = new Pool({
  user: config.db.user,
  host: 'db', // Use 'db' as defined in docker-compose.yml for container networking
  database: config.db.database,
  password: config.db.password,
  port: 5432, // Internal port within Docker network
});

const migrate = async () => {
    try {
        console.log('--- ADDING ARCHIVED COLUMN TO NEWS TABLE ---');
        
        // 1. Add archived column with default value false
        console.log('Adding archived column...');
        await pool.query('ALTER TABLE news ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE');
        console.log('✅ Archived column added successfully');
        
        // 2. Create index on archived column for faster queries
        console.log('Adding index on news.archived...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_news_archived ON news(archived)');
        console.log('✅ Index on news.archived created');
        
        console.log('--- MIGRATION COMPLETE ---');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
        process.exit();
    }
};

migrate();