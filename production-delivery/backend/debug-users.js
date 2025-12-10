import pool from './utils/database.js';

const debugUsers = async () => {
    try {
        console.log('--- USERS DEBUG ---');
        const res = await pool.query('SELECT id, username, email, role, domain FROM users');
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

debugUsers();
