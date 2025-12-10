// Script to check users in the database
// Run with: node test-users.js

import pg from 'pg';
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

async function checkUsers() {
    try {
        console.log('🔍 Checking users in database...');
        
        const result = await pool.query('SELECT id, username, email, role, domain FROM users ORDER BY id');
        
        console.log('\n📋 Users in database:');
        console.table(result.rows);
        
        console.log('\n🔐 Checking specific users:');
        const adminResult = await pool.query('SELECT id, username, email, role FROM users WHERE email = $1', ['admin@company.com']);
        if (adminResult.rows.length > 0) {
            console.log('✅ Admin user found:', adminResult.rows[0]);
        } else {
            console.log('❌ Admin user not found');
        }
        
        // Close pool
        await pool.end();
    } catch (err) {
        console.error('❌ Error checking users:', err);
    }
}

checkUsers();