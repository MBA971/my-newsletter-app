// Test script to check domain assignments
const { Pool } = require('pg');
const { default: config } = require('./backend/config/config.js');

// Create a pool using the same config as the app
const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

async function checkDomainAssignments() {
  try {
    console.log('Checking domain assignments...\n');
    
    // Get all domains
    const domainsResult = await pool.query('SELECT * FROM domains ORDER BY id');
    console.log('=== DOMAINS ===');
    domainsResult.rows.forEach(domain => {
      console.log(`${domain.id}: ${domain.name} (${domain.color})`);
    });
    
    console.log('\n=== USERS WITH DOMAINS ===');
    // Get all users with their domain names
    const usersResult = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.domain_id, d.name as domain_name
      FROM users u
      LEFT JOIN domains d ON u.domain_id = d.id
      ORDER BY u.id
    `);
    
    usersResult.rows.forEach(user => {
      console.log(`${user.id}: ${user.username} (${user.role}) - Domain: ${user.domain_name || 'None'} (ID: ${user.domain_id || 'None'})`);
    });
    
    console.log('\n=== HIRING MANAGER SPECIFICALLY ===');
    // Check hiring_manager specifically
    const hiringManagerResult = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.domain_id, d.name as domain_name
      FROM users u
      LEFT JOIN domains d ON u.domain_id = d.id
      WHERE u.username = 'hiring_manager'
    `);
    
    if (hiringManagerResult.rows.length > 0) {
      const hm = hiringManagerResult.rows[0];
      console.log(`User: ${hm.username}`);
      console.log(`Role: ${hm.role}`);
      console.log(`Domain ID: ${hm.domain_id}`);
      console.log(`Domain Name: ${hm.domain_name}`);
      
      // Check if there are other users in the same domain
      if (hm.domain_id) {
        console.log(`\n=== OTHER USERS IN ${hm.domain_name} DOMAIN ===`);
        const sameDomainResult = await pool.query(`
          SELECT u.id, u.username, u.email, u.role, u.domain_id, d.name as domain_name
          FROM users u
          LEFT JOIN domains d ON u.domain_id = d.id
          WHERE u.domain_id = $1 AND u.username != 'hiring_manager'
          ORDER BY u.id
        `, [hm.domain_id]);
        
        if (sameDomainResult.rows.length > 0) {
          sameDomainResult.rows.forEach(user => {
            console.log(`${user.id}: ${user.username} (${user.role})`);
          });
        } else {
          console.log('No other users in this domain');
        }
      }
    } else {
      console.log('hiring_manager user not found');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkDomainAssignments();