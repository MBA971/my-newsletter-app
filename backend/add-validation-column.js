import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== ADD VALIDATION COLUMN SCRIPT ===');

// Database configuration for connecting from host machine
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'newsletter_app',
    password: 'postgres',
    port: 5433, // Port exposed to host machine
});

// Alternative configuration for connecting from inside Docker network
const dockerPool = new Pool({
    user: 'postgres',
    host: 'db', // Use 'db' as defined in docker-compose.yml for container networking
    database: 'newsletter_app',
    password: 'postgres',
    port: 5432, // Internal port within Docker network
});

async function addValidationColumn() {
    // Try to connect using host configuration first
    let client;
    let poolToUse = pool;
    
    try {
        console.log('Attempting to connect to database via host...');
        client = await pool.connect();
        console.log('✅ Connected via host configuration');
    } catch (hostError) {
        console.log('❌ Failed to connect via host, trying Docker network...');
        try {
            poolToUse = dockerPool;
            client = await dockerPool.connect();
            console.log('✅ Connected via Docker network');
        } catch (dockerError) {
            console.error('❌ Failed to connect via both methods:');
            console.error('Host error:', hostError.message);
            console.error('Docker error:', dockerError.message);
            process.exit(1);
        }
    }
    
    try {
        console.log('Connecting to database...');
        
        // Add pending_validation column to news table if it doesn't exist
        console.log('Adding pending_validation column to news table...');
        try {
            await client.query(`
                ALTER TABLE news 
                ADD COLUMN IF NOT EXISTS pending_validation BOOLEAN DEFAULT TRUE
            `);
            console.log('✅ pending_validation column added to news table');
        } catch (err) {
            if (err.message.includes('column "pending_validation" of relation "news" already exists')) {
                console.log('⚠️  pending_validation column already exists');
            } else {
                throw err;
            }
        }
        
        // Add validated_by column to track who validated the article
        console.log('Adding validated_by column to news table...');
        try {
            await client.query(`
                ALTER TABLE news 
                ADD COLUMN IF NOT EXISTS validated_by INTEGER REFERENCES users(id)
            `);
            console.log('✅ validated_by column added to news table');
        } catch (err) {
            if (err.message.includes('column "validated_by" of relation "news" already exists')) {
                console.log('⚠️  validated_by column already exists');
            } else {
                throw err;
            }
        }
        
        // Add validated_at column to track when the article was validated
        console.log('Adding validated_at column to news table...');
        try {
            await client.query(`
                ALTER TABLE news 
                ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP
            `);
            console.log('✅ validated_at column added to news table');
        } catch (err) {
            if (err.message.includes('column "validated_at" of relation "news" already exists')) {
                console.log('⚠️  validated_at column already exists');
            } else {
                throw err;
            }
        }
        
        // Update existing news articles to have pending_validation = false if they were created by admins
        // This assumes that articles created by admins don't need validation
        console.log('Setting pending_validation = false for articles created by admins...');
        await client.query(`
            UPDATE news 
            SET pending_validation = false 
            WHERE author_id IN (
                SELECT id FROM users WHERE role = 'admin'
            )
        `);
        console.log('✅ Existing admin articles marked as validated');
        
        console.log('\n✅ Database schema updated successfully!');
        console.log('\nSummary of changes:');
        console.log('- Added pending_validation column to news table');
        console.log('- Added validated_by column to news table');
        console.log('- Added validated_at column to news table');
        console.log('- Updated existing admin articles to be marked as validated');
        
    } catch (error) {
        console.error('❌ Error updating database schema:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (client) {
            client.release();
        }
        await poolToUse.end();
        console.log('🔒 Database connection closed');
    }
}

// Run the script
addValidationColumn();