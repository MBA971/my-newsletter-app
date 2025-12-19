import pool from './utils/database.js';

const debug = async () => {
    try {
        console.log('--- DB DEBUG START ---');
        const res = await pool.query('SELECT id, title, author, domain FROM news ORDER BY id');
        console.log('News Articles:', res.rows);
        console.log('--- DB DEBUG END ---');
    } catch (e) {
        console.error(e);
    } finally {
        // pool.end(); // Don't end if reused, but okay for script
        process.exit();
    }
};

debug();
