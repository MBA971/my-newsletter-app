// Real debugging script to check actual database data
import { Pool } from 'pg';
import config from './backend/config/config.js';

// Create a single database connection pool to be reused
const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

async function debugData() {
  console.log('=== DEBUGGING REAL DATA ===');
  
  try {
    // Get all users
    const usersResult = await pool.query('SELECT * FROM users');
    console.log('Users:');
    usersResult.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Username: "${user.username}", Email: "${user.email}", Role: "${user.role}", Domain: "${user.domain}"`);
    });
    
    // Get all news
    const newsResult = await pool.query('SELECT * FROM news');
    console.log('\nNews:');
    newsResult.rows.forEach(article => {
      console.log(`- ID: ${article.id}, Title: "${article.title}", Author: "${article.author}", Domain: "${article.domain}"`);
    });
    
    // Check specifically for hiring user and their articles
    const hiringUserResult = await pool.query('SELECT * FROM users WHERE username LIKE $1', ['hiring%']);
    if (hiringUserResult.rows.length > 0) {
      const hiringUser = hiringUserResult.rows[0];
      console.log(`\nHiring User Found:`);
      console.log(`- Username: "${hiringUser.username}"`);
      console.log(`- Email: "${hiringUser.email}"`);
      console.log(`- Domain: "${hiringUser.domain}"`);
      
      // Find articles by this user
      const userArticles = await pool.query('SELECT * FROM news WHERE author = $1', [hiringUser.username]);
      console.log(`\nArticles by Hiring User:`);
      userArticles.rows.forEach(article => {
        console.log(`- ID: ${article.id}, Title: "${article.title}", Author: "${article.author}", Domain: "${article.domain}"`);
        
        // Check exact string comparison
        console.log(`  Exact match: "${article.author}" === "${hiringUser.username}" -> ${article.author === hiringUser.username}`);
        console.log(`  Trimmed match: "${article.author.trim()}" === "${hiringUser.username.trim()}" -> ${article.author.trim() === hiringUser.username.trim()}`);
      });
    } else {
      console.log('\nNo hiring user found in database');
    }
    
    // Close the pool
    await pool.end();
    
  } catch (error) {
    console.error('Database error:', error.message);
    console.error('Error details:', error);
  }
  
  console.log('\n=== END DEBUG ===');
}

debugData();