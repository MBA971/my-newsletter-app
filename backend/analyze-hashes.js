import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== PASSWORD HASH ANALYSIS ===');

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function analyzeHashes() {
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
            
            // Analyze the hash structure
            console.log('Hash analysis:');
            console.log('  Starts with $2b$:', user.password.startsWith('$2b$'));
            console.log('  Has correct format:', /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password));
            
            // Check for extra characters
            if (user.password.length > 60) {
                console.log('  Extra characters at end:', JSON.stringify(user.password.substring(60)));
            }
            
            // Try to verify with known passwords
            const knownPasswords = {
                'admin@company.com': 'admin123',
                'hiring@company.com': 'hiring123',
                'events@company.com': 'event123'
            };
            
            if (knownPasswords[user.email]) {
                const testPassword = knownPasswords[user.email];
                console.log(`  Testing known password '${testPassword}':`);
                
                // Test with bcrypt
                const isValid = await bcrypt.compare(testPassword, user.password);
                console.log('    Bcrypt verification:', isValid);
                
                // If bcrypt fails, let's try manual analysis
                if (!isValid) {
                    console.log('    Manual analysis:');
                    
                    // Try with substring if hash is too long
                    if (user.password.length > 60) {
                        const truncatedHash = user.password.substring(0, 60);
                        console.log('    Testing with truncated hash (60 chars):');
                        const isValidTruncated = await bcrypt.compare(testPassword, truncatedHash);
                        console.log('      Truncated hash verification:', isValidTruncated);
                        
                        // Show the difference
                        console.log('      Original hash:', JSON.stringify(user.password));
                        console.log('      Truncated hash:', JSON.stringify(truncatedHash));
                    }
                }
            }
        }
        
        client.release();
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

analyzeHashes();