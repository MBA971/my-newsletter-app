import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Assuming the .env file is in the root directory

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const migrate = async () => {
    console.log('Running migration: renaming users.domain to users.domain_id');
    const client = await pool.connect();
    try {
        await client.query('ALTER TABLE users RENAME COLUMN domain TO domain_id');
        console.log('Migration successful: Renamed users.domain to users.domain_id');
    } catch (err) {
        if (err.message.includes('column "domain_id" of relation "users" already exists')) {
            console.log('Column "domain_id" already exists. Skipping rename.');
        } else if (err.message.includes('column "domain" of relation "users" does not exist')) {
            console.log('Column "domain" does not exist. Assuming migration has already been run.');
        } else {
            console.error('Error during migration:', err);
            throw err; // re-throw to indicate failure
        }
    } finally {
        client.release();
        await pool.end();
    }
};

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
