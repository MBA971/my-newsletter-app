const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'newsletter_app',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkUsersAndDomains() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('Connected to database successfully');
    
    // Get all users with their domains
    console.log('\n--- ALL USERS ---');
    const usersResult = await client.query(`
      SELECT u.id, u.username, u.email, u.role, d.name as domain_name 
      FROM users u 
      LEFT JOIN domains d ON u.domain_id = d.id 
      ORDER BY u.id
    `);
    
    console.log('Users:');
    usersResult.rows.forEach(user => {
      console.log(`  ${user.username} (${user.role}) - Domain: ${user.domain_name || 'None'}`);
    });
    
    // Get all domains
    console.log('\n--- ALL DOMAINS ---');
    const domainsResult = await client.query('SELECT id, name, color FROM domains ORDER BY id');
    
    console.log('Domains:');
    domainsResult.rows.forEach(domain => {
      console.log(`  ${domain.name} (ID: ${domain.id})`);
    });
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Database test failed:', err);
  }
}

checkUsersAndDomains();