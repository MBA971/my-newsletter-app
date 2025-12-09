import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== RESET PASSWORDS SCRIPT ===');

// Database configuration (will use Docker environment variables)
const pool = new Pool({
    user: process.env.DB_USER || process.env.POSTGRES_USER_PROD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || process.env.POSTGRES_DB_PROD || 'newsletter',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD_PROD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// New passwords to set
const newPasswords = {
    // Admin
    'admin@company.com': 'admin123',

    // Contributors
    'hiring@company.com': 'hiring123',
    'events@company.com': 'event123',
    'journey@company.com': 'journey123',
    'comm@company.com': 'comm123',
    'admin.contributor@company.com': 'admin.contrib123',

    // Regular users
    'john.doe@company.com': 'user123',
    'jane.smith@company.com': 'user123'
};

async function resetPasswords() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('✅ Connected to database');

        // Check current users
        console.log('\n--- Current users ---');
        const usersResult = await client.query(
            'SELECT id, email, role FROM users ORDER BY id'
        );

        console.log(`Found ${usersResult.rows.length} users:`);
        for (const user of usersResult.rows) {
            console.log(`- ${user.id}: ${user.email} (${user.role})`);
        }

        // Salt rounds
        const saltRounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : 12;
        console.log(`\nUsing bcrypt salt rounds: ${saltRounds}`);

        // Reset passwords for specific users
        console.log('\n--- Resetting passwords ---');
        for (const [email, password] of Object.entries(newPasswords)) {
            console.log(`\nResetting password for ${email}...`);

            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            console.log(`  Generated hash (length: ${hashedPassword.length}): ${hashedPassword.substring(0, 20)}...`);

            // Update the user's password
            const updateResult = await client.query(
                'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
                [hashedPassword, email]
            );

            if (updateResult.rows.length > 0) {
                console.log(`  ✅ Password updated for ${updateResult.rows[0].email} (ID: ${updateResult.rows[0].id})`);

                // Verify the new password works
                const verifyResult = await client.query(
                    'SELECT password FROM users WHERE email = $1',
                    [email]
                );

                if (verifyResult.rows.length > 0) {
                    const isValid = await bcrypt.compare(password, verifyResult.rows[0].password);
                    console.log(`  🔍 Verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);
                }
            } else {
                console.log(`  ⚠️  User ${email} not found in database`);
            }
        }

        console.log('\n--- Final verification ---');
        // Test all updated passwords
        for (const [email, password] of Object.entries(newPasswords)) {
            const testResult = await client.query(
                'SELECT id, email, password, role FROM users WHERE email = $1',
                [email]
            );

            if (testResult.rows.length > 0) {
                const user = testResult.rows[0];
                const isValid = await bcrypt.compare(password, user.password);
                console.log(`${email}: ${isValid ? '✅ OK' : '❌ FAILED'}`);
            } else {
                console.log(`${email}: ⚠️  Not found`);
            }
        }

        client.release();
        console.log('\n✅ Password reset completed successfully');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

resetPasswords();