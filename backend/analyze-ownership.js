import pool from './utils/database.js';

const analyzeOwnership = async () => {
    try {
        console.log('--- OWNERSHIP ANALYSIS ---');

        // Get all users
        const users = await pool.query('SELECT id, username, domain_id FROM users');
        const userMap = users.rows.reduce((acc, u) => ({ ...acc, [u.username]: u }), {});

        // Get all news
        const news = await pool.query('SELECT id, title, author, domain FROM news');

        console.log(`Found ${users.rows.length} users and ${news.rows.length} articles.`);

        news.rows.forEach(n => {
            const match = userMap[n.author];
            const partialMatch = users.rows.find(u => u.username.trim().toLowerCase() === n.author.trim().toLowerCase());

            console.log(`Article ${n.id} ("${n.title}"):`);
            console.log(`  - Author field: "${n.author}"`);
            if (match) {
                console.log(`  - ✅ EXACT MATCH: User ID ${match.id} (${match.username})`);
            } else if (partialMatch) {
                console.log(`  - ⚠️ PARTIAL MATCH: User ID ${partialMatch.id} (${partialMatch.username})`);
            } else {
                console.log(`  - ❌ NO MATCH FOUND. (Closest user in domain "${n.domain}"?)`);
                const domainUsers = users.rows.filter(u => u.domain_id === n.domain);
                if (domainUsers.length > 0) {
                    console.log(`    Users in domain: ${domainUsers.map(u => u.username).join(', ')}`);
                }
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
};

analyzeOwnership();
