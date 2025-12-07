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

// Database configuration exactly as in server-secure.js
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function productionDebug() {
    try {
        console.log('\n--- Connecting to database ---');
        const client = await pool.connect();
        console.log('✅ Connected to database');
        
        // Check database connection details
        const dbInfo = await client.query('SELECT current_database(), current_user, inet_client_addr(), inet_client_port()');
        console.log('Database info:', dbInfo.rows[0]);
        
        // Check if we're in the right database
        const dbName = await client.query('SELECT current_database()');
        console.log('Current database:', dbName.rows[0].current_database);
        
        // Check users table
        console.log('\n--- Checking users table ---');
        const userCount = await client.query('SELECT COUNT(*) as count FROM users');
        console.log('Total users:', userCount.rows[0].count);
        
        // Get specific user that's failing
        const userResult = await client.query(
            'SELECT id, email, password, role FROM users WHERE email = $1',
            ['admin@company.com']
        );
        
        if (userResult.rows.length === 0) {
            console.log('❌ User not found in this database');
            return;
        }
        
        const user = userResult.rows[0];
        console.log('User found in this database:');
        console.log('- ID:', user.id);
        console.log('- Email:', user.email);
        console.log('- Role:', user.role);
        console.log('- Password hash:', user.password);
        console.log('- Hash length:', user.password.length);
        
        // Test password verification
        console.log('\n--- Testing password verification ---');
        const password = 'admin123';
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password verification result:', isValid);
        
        if (!isValid) {
            console.log('❌ Password verification failed in this environment');
            
            // Try different approaches
            console.log('\nTrying different approaches:');
            
            // 1. Check if hash has extra characters
            if (user.password.length > 60) {
                console.log('Hash is longer than 60 chars');
                const truncatedHash = user.password.substring(0, 60);
                const isValidTruncated = await bcrypt.compare(password, truncatedHash);
                console.log('With truncated hash:', isValidTruncated);
            }
            
            // 2. Try with different bcrypt versions
            try {
                // Try with different costs
                const testHash = await bcrypt.hash(password, 10);
                console.log('Generated test hash with cost 10, length:', testHash.length);
            } catch (err) {
                console.log('Error generating test hash:', err.message);
            }
            
        } else {
            console.log('✅ Password verification succeeded in this environment');
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

productionDebug();