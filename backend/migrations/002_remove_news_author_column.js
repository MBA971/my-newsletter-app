import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const migrate = async () => {
    console.log('Running migration: removing news.author column');
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='news' AND column_name='author'
        `);
        if (res.rowCount > 0) {
            await client.query('ALTER TABLE news DROP COLUMN author');
            console.log('Migration successful: Removed news.author column');
        } else {
            console.log('Column "author" does not exist in "news" table. Skipping drop.');
        }
    } catch (err) {
        console.error('Error during migration:', err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
};

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
