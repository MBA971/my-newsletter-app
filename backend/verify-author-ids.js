import pool from './utils/database.js';

const verify = async () => {
    try {
        console.log('--- VERIFY AUTHOR_IDS ---');
        const res = await pool.query('SELECT id, author, author_id FROM news ORDER BY id');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

verify();
