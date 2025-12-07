import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables exactly as in server-secure.js
dotenv.config();

console.log('=== PRODUCTION DEBUG ===');
console.log('Environment variables:');
console.log('- DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('- DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('- DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');
console.log('- DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

// BUT LET'S ALSO CHECK WHAT THE PRODUCTION ENVIRONMENT WOULD USE
console.log('\n=== PRODUCTION ENVIRONMENT VALUES (from docker-compose) ===');
console.log('- DB_USER (prod):', process.env.POSTGRES_USER_PROD || 'NOT SET');
console.log('- DB_HOST (prod):', 'postgres'); // Hardcoded in docker-compose
console.log('- DB_NAME (prod):', process.env.POSTGRES_DB_PROD || 'NOT SET');
console.log('- DB_PASSWORD (prod):', process.env.POSTGRES_PASSWORD_PROD ? 'SET' : 'NOT SET');
console.log('- DB_PORT (prod):', '5432'); // Hardcoded in docker-compose

// Database configuration exactly as in server-secure.js
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// ALSO TEST WITH PRODUCTION CONFIGURATION
const productionPool = new Pool({
    user: process.env.POSTGRES_USER_PROD || process.env.DB_USER || 'postgres',
    host: 'postgres', // This is the service name in docker-compose
    database: process.env.POSTGRES_DB_PROD || process.env.DB_NAME || 'newsletter',
    password: process.env.POSTGRES_PASSWORD_PROD || process.env.DB_PASSWORD || 'postgres',
    port: 5432,
});

async function productionDebug() {
    try {
        console.log('\n--- Testing with LOCAL configuration ---');
        await testWithPool(pool, 'LOCAL');
        
        console.log('\n--- Testing with PRODUCTION configuration ---');
        await testWithPool(productionPool, 'PRODUCTION');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
        await productionPool.end();
    }
}

async function testWithPool(pool, label) {
    try {
        console.log(`\n--- Connecting to database (${label}) ---`);
        const client = await pool.connect();
        console.log(`✅ Connected to ${label} database`);
        
        // Check database connection details
        const dbInfo = await client.query('SELECT current_database(), current_user, inet_client_addr(), inet_client_port()');
        console.log(`${label} database info:`, dbInfo.rows[0]);
        
        // Check if we're in the right database
        const dbName = await client.query('SELECT current_database()');
        console.log(`${label} current database:`, dbName.rows[0].current_database);
        
        // Check users table
        console.log(`\n--- Checking users table (${label}) ---`);
        const userCount = await client.query('SELECT COUNT(*) as count FROM users');
        console.log(`${label} total users:`, userCount.rows[0].count);
        
        // Get specific user that's failing
        const userResult = await client.query(
            'SELECT id, email, password, role FROM users WHERE email = $1',
            ['admin@company.com']
        );
        
        if (userResult.rows.length === 0) {
            console.log(`❌ User not found in ${label} database`);
            client.release();
            return;
        }
        
        const user = userResult.rows[0];
        console.log(`${label} user found:`);
        console.log('- ID:', user.id);
        console.log('- Email:', user.email);
        console.log('- Role:', user.role);
        console.log('- Password hash:', user.password);
        console.log('- Hash length:', user.password.length);
        
        // Test password verification
        console.log(`\n--- Testing password verification (${label}) ---`);
        const password = 'admin123';
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`${label} password verification result:`, isValid);
        
        client.release();
        
    } catch (error) {
        console.error(`❌ ${label} Error:`, error.message);
    }
}

productionDebug();