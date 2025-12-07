import { Pool } from 'pg';
import bcrypt from 'bcrypt';
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

async function testAuth() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        
        // Test credentials
        const email = 'admin@company.com';
        const password = 'admin123';
        
        console.log(`Testing login for ${email} with password ${password}`);
        
        // Find user
        const result = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            console.log('❌ User not found');
            client.release();
            return;
        }
        
        const user = result.rows[0];
        console.log(`✅ User found: ${user.username} (${user.email})`);
        console.log(`Password hash: ${user.password}`);
        
        // Verify password
        console.log('Verifying password...');
        const isValid = await bcrypt.compare(password, user.password);
        
        if (isValid) {
            console.log('✅ Password is correct');
        } else {
            console.log('❌ Password is incorrect');
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error testing auth:', error.message);
    } finally {
        await pool.end();
    }
}

// Run the test
testAuth();