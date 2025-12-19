import pool from './utils/database.js';

const testConnection = async () => {
    try {
        console.log('Testing database connection...');
        const result = await pool.query('SELECT NOW()');
        console.log('Database connection successful:', result.rows[0]);
    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        await pool.end();
    }
};

testConnection();