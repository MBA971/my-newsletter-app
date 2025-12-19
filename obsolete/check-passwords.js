import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== PASSWORD VERIFICATION DEBUG ===');

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Test passwords
const testPasswords = {
    'admin@company.com': 'admin123',
    'hiring@company.com': 'hiring123',
    'events@company.com': 'event123'
};

async function checkPasswords() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        
        console.log('Fetching users from database...');
        const result = await client.query('SELECT id, email, password, role FROM users ORDER BY id');
        
        console.log(`\nFound ${result.rows.length} users:`);
        
        for (const user of result.rows) {
            console.log('\n--- User ---');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Password hash:', user.password);
            console.log('Hash length:', user.password.length);
            
            // Check if we have a test password for this user
            if (testPasswords[user.email]) {
                const testPassword = testPasswords[user.email];
                console.log('Expected password:', testPassword);
                
                // Test bcrypt verification
                console.log('Verifying with bcrypt...');
                const isValid = await bcrypt.compare(testPassword, user.password);
                console.log('Bcrypt verification result:', isValid);
                
                // Also test with different rounds
                console.log('Testing with different bcrypt rounds...');
                for (let rounds = 10; rounds <= 14; rounds++) {
                    try {
                        const testHash = await bcrypt.hash(testPassword, rounds);
                        console.log(`  Round ${rounds} hash length: ${testHash.length}`);
                    } catch (err) {
                        console.log(`  Round ${rounds} failed:`, err.message);
                    }
                }
            } else {
                console.log('No test password defined for this user');
            }
        }
        
        client.release();
        
        // Test generating a new hash for comparison
        console.log('\n=== HASH GENERATION TEST ===');
        const saltRounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : 12;
        console.log('Current BCRYPT_ROUNDS:', saltRounds);
        
        const testPassword = 'admin123';
        console.log('Generating hash for:', testPassword);
        const newHash = await bcrypt.hash(testPassword, saltRounds);
        console.log('New hash:', newHash);
        console.log('New hash length:', newHash.length);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

checkPasswords();