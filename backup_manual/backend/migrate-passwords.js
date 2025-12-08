// Script to migrate existing passwords to bcrypt hashes
// Run with: node migrate-passwords.js

import pg from 'pg';
import bcrypt from 'bcrypt';
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

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

async function migratePasswords() {
    try {
        console.log('🔐 Starting password migration...\n');

        // Get all users
        const result = await pool.query('SELECT id, username, email, password FROM users');
        const users = result.rows;

        console.log(`Found ${users.length} users to process\n`);

        let migrated = 0;
        let skipped = 0;

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2b$)
            if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                console.log(`⏭️  Skipping ${user.username} - already hashed`);
                skipped++;
                continue;
            }

            // Hash the plain text password
            const hashedPassword = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

            // Update in database
            await pool.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, user.id]
            );

            console.log(`✅ Migrated ${user.username} (${user.email})`);
            migrated++;
        }

        console.log(`\n✨ Migration complete!`);
        console.log(`   Migrated: ${migrated}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total: ${users.length}\n`);

    } catch (error) {
        console.error('❌ Error migrating passwords:', error);
    } finally {
        await pool.end();
    }
}

// Run the migration
migratePasswords();
