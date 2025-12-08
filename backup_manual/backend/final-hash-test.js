// Script to generate and test a single hash
// Run with: node final-hash-test.js

import bcrypt from 'bcrypt';
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

async function generateAndTestHash() {
    const password = 'admin123';
    const saltRounds = 12;
    
    console.log('🔐 Generating bcrypt hash for:', password);
    console.log('🔢 Salt rounds:', saltRounds);
    
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('🔑 Generated hash:', hash);
    console.log('📏 Hash length:', hash.length);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('✅ Verification result:', isValid ? 'SUCCESS' : 'FAILED');
    
    // Update the database with this hash
    try {
        console.log('\n💾 Updating database with new hash...');
        await pool.query(
            'UPDATE users SET password = $1 WHERE email = $2',
            [hash, 'admin@company.com']
        );
        console.log('✅ Database updated successfully');
        
        // Verify the update
        const result = await pool.query(
            'SELECT password FROM users WHERE email = $1',
            ['admin@company.com']
        );
        
        if (result.rows.length > 0) {
            const dbHash = result.rows[0].password;
            console.log('💾 Database hash:', dbHash);
            console.log('📏 Database hash length:', dbHash.length);
            
            const dbValid = await bcrypt.compare(password, dbHash);
            console.log('✅ Database verification:', dbValid ? 'SUCCESS' : 'FAILED');
        }
        
        await pool.end();
    } catch (err) {
        console.error('❌ Database error:', err);
    }
}

generateAndTestHash();