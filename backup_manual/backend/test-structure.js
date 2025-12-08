// Simple test script to verify the new project structure works correctly
import pool from './utils/database.js';

async function testStructure() {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log('Current time from database:', result.rows[0].now);
    
    // Test if tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('✅ Database tables check successful');
    console.log('Existing tables:', tables.rows.map(row => row.table_name));
    
    // Close the pool
    await pool.end();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testStructure();