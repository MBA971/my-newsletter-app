import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== DIRECT LOGIN TEST ===');

// Database configuration exactly as in server-secure.js
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function directLoginTest() {
    try {
        const email = 'admin@company.com';
        const password = 'admin123';
        
        console.log('Testing login with:');
        console.log('- Email:', email);
        console.log('- Password:', password);
        console.log('- Password length:', password.length);
        console.log('- Password char codes:', [...password].map(c => c.charCodeAt(0)));
        
        // Step 1: Find user exactly as in login route
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
        
        // Step 2: Verify password exactly as in login route (with our fix)
        console.log('\n--- Step 2: Verifying password ---');
        
        // Show exactly what we're comparing
        console.log('Raw password from request:', JSON.stringify(password));
        console.log('Password length:', password.length);
        
        const trimmedPassword = password.trim();
        console.log('Trimmed password:', JSON.stringify(trimmedPassword));
        console.log('Trimmed password length:', trimmedPassword.length);
        
        console.log('Stored hash:', JSON.stringify(user.password));
        console.log('Hash length:', user.password.length);
        
        // Test with trimmed password (our fix)
        console.log('\nTesting with trimmed password:');
        const isValidTrimmed = await bcrypt.compare(trimmedPassword, user.password);
        console.log('Trimmed password verification result:', isValidTrimmed);
        
        // Test with original password (old behavior)
        console.log('\nTesting with original password:');
        const isValidOriginal = await bcrypt.compare(password, user.password);
        console.log('Original password verification result:', isValidOriginal);
        
        if (isValidTrimmed) {
            console.log('\n✅ LOGIN WOULD SUCCEED with our fix!');
        } else if (isValidOriginal) {
            console.log('\n⚠️  LOGIN WOULD SUCCEED with original code but fail with our fix');
        } else {
            console.log('\n❌ LOGIN WOULD FAIL even with original code');
            
            // Let's try to understand why
            console.log('\n--- DEEP DIVE ANALYSIS ---');
            
            // Check if there are any unusual characters
            console.log('Password byte analysis:');
            const passwordBuffer = Buffer.from(password, 'utf8');
            console.log('Password as buffer:', passwordBuffer);
            console.log('Password hex:', passwordBuffer.toString('hex'));
            
            console.log('Hash byte analysis:');
            const hashBuffer = Buffer.from(user.password, 'utf8');
            console.log('Hash as buffer:', hashBuffer);
            console.log('Hash hex:', hashBuffer.toString('hex'));
            
            // Try different encoding approaches
            console.log('\nTrying different approaches:');
            
            // Try with different normalization
            const normalizedPassword = password.normalize('NFC');
            console.log('NFC Normalized password:', JSON.stringify(normalizedPassword));
            const isValidNormalized = await bcrypt.compare(normalizedPassword, user.password);
            console.log('Normalized password verification result:', isValidNormalized);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

directLoginTest();