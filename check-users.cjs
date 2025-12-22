const { Pool } = require('pg');

// Database connection - using the same credentials as in docker-compose.yml
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'newsletter_app',
  password: 'postgres',
  port: 5433, // Host port mapped from container port 5432
});

async function checkUsers() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully');
    
    // Get all users
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
    console.error('Error:', err.message);
  }
}

checkUsers();