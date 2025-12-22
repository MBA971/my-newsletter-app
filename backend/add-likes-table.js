import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== ADD LIKES TABLE SCRIPT ===');

// Database configuration for connecting from host machine
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'newsletter_app',
    password: 'postgres',
    port: 5433, // Port exposed to host machine
});

async function addLikesTable() {
    const client = await pool.connect();
    
    try {
        console.log('Connecting to database...');
        
        // Create the likes table
        console.log('Creating likes table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS likes (
                id SERIAL PRIMARY KEY,
                news_id INTEGER NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
                UNIQUE(news_id, ip_address)
            )
        `);
        console.log('✅ Likes table created successfully');
        
        // Add likes_count column to news table if it doesn't exist
        console.log('Adding likes_count column to news table...');
        try {
            await client.query(`
                ALTER TABLE news 
                ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0
            `);
            console.log('✅ likes_count column added to news table');
        } catch (err) {
            if (err.message.includes('column "likes_count" of relation "news" already exists')) {
                console.log('⚠️  likes_count column already exists');
            } else {
                throw err;
            }
        }
        
        // Create indexes for better performance
        console.log('Creating indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_likes_news_id ON likes(news_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_likes_ip_address ON likes(ip_address)
        `);
        console.log('✅ Indexes created successfully');
        
        // Update existing news articles to have likes_count = 0 if null
        console.log('Initializing likes_count for existing articles...');
        await client.query(`
            UPDATE news 
            SET likes_count = 0 
            WHERE likes_count IS NULL
        `);
        console.log('✅ Existing articles initialized with likes_count = 0');
        
        console.log('\n✅ Database schema updated successfully!');
        console.log('\nSummary of changes:');
        console.log('- Created likes table with news_id, ip_address, and created_at columns');
        console.log('- Added likes_count column to news table');
        console.log('- Added foreign key constraint and unique constraint');
        console.log('- Created indexes for better performance');
        
    } catch (error) {
        console.error('❌ Error updating database schema:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        client.release();
        await pool.end();
        console.log('🔒 Database connection closed');
    }
}

// Run the script
addLikesTable();