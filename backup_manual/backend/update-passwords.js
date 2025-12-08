import { Client } from 'pg';
import bcrypt from 'bcrypt';

// Database configuration
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'newsletter_app',
    password: 'postgres',
    port: 5432,
});

async function updatePasswords() {
    try {
        await client.connect();
        console.log('Connected to database');
        
        // Update admin password
        const adminPassword = 'admin123';
        const adminHash = await bcrypt.hash(adminPassword, 12);
        console.log('Admin hash:', adminHash);
        console.log('Admin hash length:', adminHash.length);
        
        const adminResult = await client.query(
            'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
            [adminHash, 'admin@company.com']
        );
        console.log('Admin update result:', adminResult.rows);
        
        // Update hiring password
        const hiringPassword = 'hiring123';
        const hiringHash = await bcrypt.hash(hiringPassword, 12);
        console.log('Hiring hash:', hiringHash);
        console.log('Hiring hash length:', hiringHash.length);
        
        const hiringResult = await client.query(
            'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
            [hiringHash, 'hiring@company.com']
        );
        console.log('Hiring update result:', hiringResult.rows);
        
        // Verify the updates
        const verifyResult = await client.query(
            'SELECT email, LENGTH(password) as password_length FROM users WHERE email IN ($1, $2)',
            ['admin@company.com', 'hiring@company.com']
        );
        console.log('Verification result:', verifyResult.rows);
        
        await client.end();
        console.log('Disconnected from database');
        
    } catch (error) {
        console.error('Error:', error.message);
        await client.end();
    }
}

updatePasswords();