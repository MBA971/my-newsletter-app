import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Testing PostgreSQL Connection...');
console.log('================================');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'pulse_user',
  password: process.env.DB_PASSWORD || 'pulse_password_123',
  database: process.env.DB_NAME || 'pulse_production',
};

console.log('Connection Details:');
console.log('- Host:', dbConfig.host);
console.log('- Port:', dbConfig.port);
console.log('- User:', dbConfig.user);
console.log('- Database:', dbConfig.database);
console.log('- Password:', dbConfig.password ? 'SET' : 'NOT SET');

// Create a new client
const client = new Client(dbConfig);

async function testConnection() {
  try {
    // Connect to the database
    await client.connect();
    console.log('\n✅ Successfully connected to PostgreSQL database!');
    
    // Run a simple query to verify
    const result = await client.query('SELECT version();');
    console.log('\n📦 PostgreSQL Version:');
    console.log(result.rows[0].version);
    
    // Check if users table exists and count users
    try {
      const userCountResult = await client.query('SELECT COUNT(*) as count FROM users;');
      console.log(`\n👥 Users Table Count: ${userCountResult.rows[0].count} users found`);
      
      // Get first user (without password) to verify data
      const firstUserResult = await client.query('SELECT id, email, role, created_at FROM users LIMIT 1;');
      if (firstUserResult.rows.length > 0) {
        console.log('\n👤 Sample User Data:');
        console.log(firstUserResult.rows[0]);
      }
    } catch (err) {
      console.log('\n⚠️  Could not query users table:', err.message);
    }
    
    await client.end();
    console.log('\n🔒 Disconnected from database');
  } catch (err) {
    console.error('\n❌ Failed to connect to PostgreSQL database:');
    console.error('Error:', err.message);
    if (err.code) {
      console.error('Error Code:', err.code);
    }
    
    // Try to provide helpful troubleshooting information
    switch (err.code) {
      case 'ECONNREFUSED':
        console.log('\n🔧 Troubleshooting tips:');
        console.log('- Check if PostgreSQL container is running');
        console.log('- Verify DB_HOST and DB_PORT settings');
        break;
      case '28P01':
        console.log('\n🔧 Troubleshooting tips:');
        console.log('- Check if username and password are correct');
        console.log('- Verify credentials in .env file');
        break;
      case '3D000':
        console.log('\n🔧 Troubleshooting tips:');
        console.log('- Check if database name is correct');
        console.log('- Verify DB_NAME setting in .env file');
        break;
      default:
        console.log('\n🔧 General troubleshooting tips:');
        console.log('- Check all database connection settings in .env file');
        console.log('- Ensure PostgreSQL container is running');
        console.log('- Verify network connectivity between services');
    }
  }
}

testConnection();