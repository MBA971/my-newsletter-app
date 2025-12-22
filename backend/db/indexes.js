/**
 * Database indexes setup script
 */

import pool from '../utils/database.js';

export const createIndexes = async () => {
  try {
    console.log('Creating database indexes...');

    // Indexes for users table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✅ Created index on users.email');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    console.log('✅ Created index on users.role');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_domain_id ON users(domain_id);
    `);
    console.log('✅ Created index on users.domain_id');

    // Indexes for news table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_news_domain_id ON news(domain_id);
    `);
    console.log('✅ Created index on news.domain_id');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_news_date ON news(date);
    `);
    console.log('✅ Created index on news.date');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id);
    `);
    console.log('✅ Created index on news.author_id');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_news_archived ON news(archived);
    `);
    console.log('✅ Created index on news.archived');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_news_pending_validation ON news(pending_validation);
    `);
    console.log('✅ Created index on news.pending_validation');

    // Composite indexes for common queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_news_domain_id_archived ON news(domain_id, archived);
    `);
    console.log('✅ Created composite index on news(domain_id, archived)');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_news_domain_id_date ON news(domain_id, date);
    `);
    console.log('✅ Created composite index on news(domain_id, date)');

    // Indexes for audit log table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
    `);
    console.log('✅ Created index on audit_log.user_id');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
    `);
    console.log('✅ Created index on audit_log.action');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
    `);
    console.log('✅ Created index on audit_log.timestamp');

    // Indexes for likes table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_likes_news_id ON likes(news_id);
    `);
    console.log('✅ Created index on likes.news_id');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_likes_ip_address ON likes(ip_address);
    `);
    console.log('✅ Created index on likes.ip_address');

    // Indexes for subscribers table
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
    `);
    console.log('✅ Created index on subscribers.email');

    console.log('✅ All database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
    throw error;
  }
};

// If running this file directly, execute the function
if (import.meta.url === `file://${process.argv[1]}`) {
  createIndexes()
    .then(() => {
      console.log('Database indexes setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database indexes setup failed:', error);
      process.exit(1);
    });
}