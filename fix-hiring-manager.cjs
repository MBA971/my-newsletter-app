const { Pool } = require('pg');

// Database connection - using the same credentials as in .env
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'newsletter_app',
  password: 'postgres',
  port: 5433, // Using the port from .env
});

async function fixHiringManagerDomain() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected successfully');
    
    // First, get the Hiring domain ID
    console.log('Getting Hiring domain ID...');
    const domainResult = await client.query("SELECT id FROM domains WHERE name = 'Hiring'");
    
    if (domainResult.rows.length === 0) {
      console.log('Hiring domain not found, creating it...');
      const createDomainResult = await client.query(
        "INSERT INTO domains (name, color) VALUES ('Hiring', '#3b82f6') RETURNING id"
      );
      const domainId = createDomainResult.rows[0].id;
      console.log(`Created Hiring domain with ID: ${domainId}`);
      
      // Update the hiring_manager user to assign the Hiring domain
      console.log('Updating hiring_manager user...');
      const updateResult = await client.query(
        "UPDATE users SET domain_id = $1 WHERE username = 'hiring_manager' RETURNING *",
        [domainId]
      );
      
      if (updateResult.rows.length > 0) {
        console.log('Successfully updated hiring_manager user domain');
      } else {
        console.log('hiring_manager user not found');
      }
    } else {
      const domainId = domainResult.rows[0].id;
      console.log(`Found Hiring domain with ID: ${domainId}`);
      
      // Update the hiring_manager user to assign the Hiring domain
      console.log('Updating hiring_manager user...');
      const updateResult = await client.query(
        "UPDATE users SET domain_id = $1 WHERE username = 'hiring_manager' RETURNING *",
        [domainId]
      );
      
      if (updateResult.rows.length > 0) {
        console.log('Successfully updated hiring_manager user domain');
        console.log('Updated user:', updateResult.rows[0]);
      } else {
        console.log('hiring_manager user not found');
      }
    }
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fixHiringManagerDomain();