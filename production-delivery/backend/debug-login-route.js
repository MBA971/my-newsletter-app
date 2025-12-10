import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== LOGIN ROUTE DEBUG ===');

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function debugLoginRoute() {
    try {
        const email = 'admin@company.com';
        const password = 'admin123';
        
        console.log('Simulating login with:');
        console.log('- Email:', email);
        console.log('- Password:', password);
        console.log('- Password length:', password.length);
        
        // Check for whitespace issues
        console.log('\n--- Whitespace Check ---');
        console.log('Password has leading/trailing whitespace:', password !== password.trim());
        console.log('Password char codes:', [...password].map((c, i) => `${i}:${c.charCodeAt(0)}`).join(' '));
        
        // Test with trimmed password
        const trimmedPassword = password.trim();
        if (password !== trimmedPassword) {
            console.log('Trimmed password:', trimmedPassword);
            console.log('Trimmed password length:', trimmedPassword.length);
        }
        
        // Step 1: Find user (exactly as in login route)
        console.log('\n--- Step 1: Querying database ---');
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
        
        // Step 2: Verify password (exactly as in login route)
        console.log('\n--- Step 2: Verifying password ---');
        console.log('Comparing password with hash...');
        console.log('- Password:', password);
        console.log('- Hash:', user.password);
        
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password verification result:', isValid);
        
        if (!isValid) {
            console.log('❌ PASSWORD VERIFICATION FAILED');
            
            // Let's try some additional debugging
            console.log('\n--- Additional Debugging ---');
            
            // Check if there are any hidden characters
            console.log('Password char codes:', [...password].map(c => c.charCodeAt(0)));
            console.log('Hash char codes (first 10):', [...user.password.substring(0, 10)].map(c => c.charCodeAt(0)));
            
            // Try trimming the password
            const trimmedPassword = password.trim();
            console.log('Trimmed password:', trimmedPassword);
            console.log('Trimmed password length:', trimmedPassword.length);
            
            const isTrimmedValid = await bcrypt.compare(trimmedPassword, user.password);
            console.log('Trimmed password verification result:', isTrimmedValid);
            
            // Try with different encodings
            const passwordBuffer = Buffer.from(password, 'utf8');
            console.log('Password as UTF-8 buffer length:', passwordBuffer.length);
            
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

debugLoginRoute();