import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== CHECK PRODUCTION DATABASE ===');

// Try to connect to the production database directly
// This assumes the PostgreSQL port is exposed or accessible from outside Docker
const productionPool = new Pool({
    user: process.env.POSTGRES_USER_PROD || 'pulse_user',
    host: 'localhost', // Try localhost since we're outside Docker
    database: process.env.POSTGRES_DB_PROD || 'pulse_production',
    password: process.env.POSTGRES_PASSWORD_PROD || 'pulse_password_123',
    port: 5432, // Default PostgreSQL port
});

async function checkProductionDb() {
    try {
        console.log('Attempting to connect to production database...');
        console.log('- Host: localhost');
        console.log('- Database:', process.env.POSTGRES_DB_PROD || 'pulse_production');
        console.log('- User:', process.env.POSTGRES_USER_PROD || 'pulse_user');
        console.log('- Port: 5432');
        
        const client = await productionPool.connect();
        console.log('✅ Connected to production database');
        
        // Check users table
        console.log('\n--- Checking users table ---');
        const userCount = await client.query('SELECT COUNT(*) as count FROM users');
        console.log('Total users:', userCount.rows[0].count);
        
        // Get all users
        const usersResult = await client.query(
            'SELECT id, email, password, role FROM users ORDER BY id'
        );
        
        console.log(`\nFound ${usersResult.rows.length} users:`);
        
        for (const user of usersResult.rows) {
            console.log('\n--- User ---');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Password hash:', user.password);
            console.log('Hash length:', user.password.length);
            
            // Test with known passwords
            const knownPasswords = {
                'admin@company.com': 'admin123',
                'hiring@company.com': 'hiring123',
                'events@company.com': 'event123'
            };
            
            if (knownPasswords[user.email]) {
                const testPassword = knownPasswords[user.email];
                console.log(`Testing known password '${testPassword}':`);
                
                const isValid = await bcrypt.compare(testPassword, user.password);
                console.log('  Verification result:', isValid);
                
                if (!isValid) {
                    console.log('  ❌ Password verification failed');
                    
                    // Try with different approaches
                    console.log('  Trying different approaches:');
                    
                    // 1. Check if hash has extra characters
                    if (user.password.length > 60) {
                        console.log('    Hash is longer than 60 chars');
                        const truncatedHash = user.password.substring(0, 60);
                        const isValidTruncated = await bcrypt.compare(testPassword, truncatedHash);
                        console.log('    With truncated hash:', isValidTruncated);
                    }
                } else {
                    console.log('  ✅ Password verification succeeded');
                }
            }
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error connecting to production database:', error.message);
        console.log('\nThis is expected if the database is only accessible from within Docker.');
        console.log('The issue is likely that the production database has different password hashes.');
    } finally {
        await productionPool.end();
    }
}

checkProductionDb();