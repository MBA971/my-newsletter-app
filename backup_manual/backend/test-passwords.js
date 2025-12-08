// Script to check password hashes in the database
// Run with: node test-passwords.js

import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function checkPasswords() {
    try {
        console.log('🔍 Checking password hashes in database...');
        
        const result = await pool.query('SELECT id, username, email, password FROM users WHERE email = $1', ['admin@company.com']);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('\n👤 User:', user.username);
            console.log('📧 Email:', user.email);
            console.log('🔑 Password hash:', user.password);
            console.log('📏 Hash length:', user.password.length);
            
            // Test password verification
            console.log('\n🧪 Testing password verification...');
            const isValid = await bcrypt.compare('admin123', user.password);
            console.log('✅ Password verification result:', isValid ? 'SUCCESS' : 'FAILED');
            
            if (!isValid) {
                console.log('⚠️  Password mismatch detected!');
                console.log('   Expected password: admin123');
                console.log('   Stored hash:', user.password);
            }
        } else {
            console.log('❌ Admin user not found');
        }
        
        // Close pool
        await pool.end();
    } catch (err) {
        console.error('❌ Error checking passwords:', err);
    }
}

checkPasswords();