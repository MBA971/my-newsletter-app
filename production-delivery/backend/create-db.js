import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default postgres DB
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function createDatabase() {
    try {
        await client.connect();

        // Check if database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'newsletter'");

        if (res.rows.length === 0) {
            console.log('Creating database "newsletter"...');
            await client.query('CREATE DATABASE newsletter');
            console.log('✅ Database "newsletter" created successfully');
        } else {
            console.log('ℹ️  Database "newsletter" already exists');
        }

    } catch (err) {
        console.error('❌ Error creating database:', err);
    } finally {
        await client.end();
    }
}

createDatabase();
