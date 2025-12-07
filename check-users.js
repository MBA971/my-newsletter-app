import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkUsers() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        
        // Check if users table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('❌ Users table does not exist');
            client.release();
            return;
        }
        
        // Get all users
        const result = await client.query('SELECT id, username, email, password, role, domain FROM users ORDER BY id');
        
        console.log(`\n📋 Found ${result.rows.length} users:`);
        result.rows.forEach(user => {
            console.log(`   ID: ${user.id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Domain: ${user.domain || 'null'}`);
            console.log(`   Password (first 20 chars): ${user.password.substring(0, 20)}${user.password.length > 20 ? '...' : ''}`);
            console.log(`   Password length: ${user.password.length}`);
            console.log('   ---');
        });
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error checking users:', error.message);
    } finally {
        await pool.end();
    }
}

// Run the check
checkUsers();