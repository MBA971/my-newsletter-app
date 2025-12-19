import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Create a single database connection pool to be reused
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db', // Use 'db' for Docker container name
  database: process.env.DB_NAME || 'newsletter_app',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const addAdditionalIndexes = async () => {
    try {
        console.log('--- ADDING ADDITIONAL DATABASE INDEXES ---');
        
        // Add composite index on news table for common query patterns
        console.log('Adding composite index on news(archived, pending_validation, date)...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_news_status_date ON news(archived, pending_validation, date)');
        console.log('✅ Composite index on news(archived, pending_validation, date) created');
        
        // Add index on news.author_id and archived for contributor queries
        console.log('Adding composite index on news(author_id, archived)...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_news_author_archived ON news(author_id, archived)');
        console.log('✅ Composite index on news(author_id, archived) created');
        
        // Add index on likes.news_id for faster like counting
        console.log('Adding index on likes.news_id...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_likes_news_id ON likes(news_id)');
        console.log('✅ Index on likes.news_id created');
        
        // Add index on audit_log.user_id for faster user activity queries
        console.log('Adding index on audit_log.user_id...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)');
        console.log('✅ Index on audit_log.user_id created');
        
        console.log('--- ADDITIONAL INDEX CREATION COMPLETE ---');
    } catch (e) {
        console.error('Error adding indexes:', e);
    } finally {
        await pool.end();
        process.exit();
    }
};

addAdditionalIndexes();