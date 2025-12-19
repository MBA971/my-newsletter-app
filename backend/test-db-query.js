import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'newsletter_app',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function testQuery() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('Connected to database successfully');
    
    // Test the JOIN query
    console.log('Testing JOIN query...');
    const result = await client.query(`
      SELECT n.id, n.title, n.domain, d.name as domain_name 
      FROM news n 
      LEFT JOIN domains d ON n.domain = d.id 
      WHERE n.id = 90
    `);
    
    console.log('Query result:', result.rows);
    
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Database test failed:', err);
  }
}

testQuery();