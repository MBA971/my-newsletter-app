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
    console.log('Running migration: renaming news.domain to news.domain_id');
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='news' AND column_name='domain'
        `);
        if (res.rowCount > 0) {
            await client.query('ALTER TABLE news RENAME COLUMN domain TO domain_id');
            console.log('Migration successful: Renamed news.domain to news.domain_id');
        } else {
            console.log('Column "domain" does not exist in "news" table. Assuming already renamed to domain_id.');
        }
    } catch (err) {
        if (err.message.includes('column "domain_id" of relation "news" already exists')) {
            console.log('Column "domain_id" already exists. Skipping rename.');
        } else {
            console.error('Error during migration:', err);
            throw err;
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
