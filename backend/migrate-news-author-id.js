import pool from './utils/database.js';

const migrate = async () => {
    try {
        console.log('--- MIGRATION START ---');

        // 1. Add Column
        console.log('Adding author_id column...');
        await pool.query('ALTER TABLE news ADD COLUMN IF NOT EXISTS author_id INTEGER');

        // 2. Get Mapping
        const users = await pool.query('SELECT id, username FROM users');
        const userMap = users.rows.reduce((acc, u) => ({ ...acc, [u.username]: u.id }), {});

        // Handle mismatched username manually
        // 'journey_specialist' (in news) -> 'journey_specialiste' (in users)
        // Find ID for 'journey_specialiste'
        const journeyUser = users.rows.find(u => u.username === 'journey_specialiste');
        if (journeyUser) {
            userMap['journey_specialist'] = journeyUser.id;
        }

        // 3. Update News
        const news = await pool.query('SELECT id, author FROM news');

        for (const article of news.rows) {
            const userId = userMap[article.author];
            if (userId) {
                await pool.query('UPDATE news SET author_id = $1 WHERE id = $2', [userId, article.id]);
                console.log(`Updated Article ${article.id} (${article.author}) -> Author ID ${userId}`);
            } else {
                console.warn(`⚠️ Could not find user for Article ${article.id} author "${article.author}"`);
            }
        }

        console.log('--- MIGRATION COMPLETE ---');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

migrate();
