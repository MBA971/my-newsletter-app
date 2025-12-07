import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== EXACT LOGIN REPLICATION ===');

// Database configuration exactly as in server-secure.js
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function exactLoginReplication() {
    try {
        // Exactly replicate what happens in the login route
        const email = 'admin@company.com';
        const password = 'admin123';
        
        console.log('Replicating login with:');
        console.log('- Email:', email);
        console.log('- Password:', password);
        
        // Exactly as in login route
        console.log('\n--- Replicating database query ---');
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        console.log('Database query result count:', result.rows.length);
        
        if (result.rows.length === 0) {
            console.log('❌ USER NOT FOUND');
            return;
        }
        
        const user = result.rows[0];
        console.log('User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            password_hash: user.password,
            password_hash_length: user.password.length
        });
        
        // Exactly as in login route
        console.log('\n--- Replicating password verification ---');
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password verification result:', isValid);
        
        if (!isValid) {
            console.log('❌ PASSWORD VERIFICATION FAILED');
            
            // Additional debugging
            console.log('\n--- Additional Analysis ---');
            console.log('Password bytes:', Buffer.from(password).toString('hex'));
            console.log('Hash bytes:', Buffer.from(user.password).toString('hex'));
            
            // Try with different approaches
            console.log('\nTrying different verification approaches:');
            
            // 1. Trim password
            const trimmedPassword = password.trim();
            const isValidTrimmed = await bcrypt.compare(trimmedPassword, user.password);
            console.log('With trimmed password:', isValidTrimmed);
            
            // 2. Check if hash has extra characters
            if (user.password.length > 60) {
                console.log('Hash is longer than 60 chars, trying truncated version');
                const truncatedHash = user.password.substring(0, 60);
                const isValidTruncated = await bcrypt.compare(password, truncatedHash);
                console.log('With truncated hash:', isValidTruncated);
            }
            
            // 3. Check if password has hidden characters
            const passwordChars = [...password];
            console.log('Password character codes:', passwordChars.map((c, i) => `${i}:${c.charCodeAt(0)}`).join(', '));
            
        } else {
            console.log('✅ PASSWORD VERIFICATION SUCCESSFUL');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

exactLoginReplication();