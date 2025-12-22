import { Pool } from 'pg';

// Create a single database connection pool to be reused
const pool = new Pool({
  user: 'postgres',
  host: 'db', // Use 'db' for Docker
  database: 'newsletter_app',
  password: 'postgres',
  port: 5432,
});

const addIndexes = async () => {
    try {
        console.log('--- ADDING DATABASE INDEXES ---');
        
        // Add index on news.author_id for faster joins
        console.log('Adding index on news.author_id...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id)');
        console.log('✅ Index on news.author_id created');
        
        // Add index on news.domain for faster domain-based queries
        console.log('Adding index on news.domain...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_news_domain ON news(domain)');
        console.log('✅ Index on news.domain created');
        
        // Add index on news.date for faster sorting
        console.log('Adding index on news.date...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_news_date ON news(date)');
        console.log('✅ Index on news.date created');
        
        // Add index on users.domain_id for faster joins
        console.log('Adding index on users.domain_id...');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_users_domain_id ON users(domain_id)');
        console.log('✅ Index on users.domain_id created');
        
        console.log('--- INDEX CREATION COMPLETE ---');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit();
    }
};

addIndexes();