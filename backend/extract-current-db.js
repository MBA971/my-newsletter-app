import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;

// Get the directory name (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
// When running inside the container, use 'db' as hostname
// When running from host, use 'localhost' with port 5433
const isInsideContainer = process.env.DB_HOST === 'db';
const config = {
  user: process.env.DB_USER || 'postgres',
  host: isInsideContainer ? 'db' : 'localhost',
  database: process.env.DB_NAME || 'newsletter_app',
  password: process.env.DB_PASSWORD || 'postgres',
  port: isInsideContainer ? 5432 : 5433,
};

async function extractDatabase() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('Connected to database successfully');
    
    let exportContent = `-- Database export script for newsletter_app
-- This script contains the current database structure and data with properly hashed passwords
-- Generated on: ${new Date().toISOString()}

`;

    // Add table creation statements with updated schema
    exportContent += `-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(50) NOT NULL
);

-- Create users table (using integer domain IDs)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  domain INTEGER REFERENCES domains(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create news table (using integer domain IDs and author_id only)
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  domain INTEGER NOT NULL REFERENCES domains(id),
  content TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100),
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table for connection/disconnection tracking
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(50) NOT NULL, -- 'login', 'logout'
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

`;

    // Extract domains data
    console.log('Extracting domains data...');
    const domainsResult = await client.query('SELECT * FROM domains ORDER BY id');
    if (domainsResult.rows.length > 0) {
      exportContent += '-- Insert domains\n';
      exportContent += 'INSERT INTO domains (id, name, color) VALUES\n';
      const domainValues = domainsResult.rows.map((row, index) => {
        const isLast = index === domainsResult.rows.length - 1;
        return `  (${row.id}, '${row.name.replace(/'/g, "''")}', '${row.color}')${isLast ? ';' : ','}`;
      }).join('\n');
      exportContent += domainValues + '\n\n';
    }

    // Extract users data
    console.log('Extracting users data...');
    const usersResult = await client.query('SELECT * FROM users ORDER BY id');
    if (usersResult.rows.length > 0) {
      exportContent += '-- Insert users (passwords are properly hashed)\n';
      exportContent += 'INSERT INTO users (id, username, email, password, role, domain, created_at) VALUES\n';
      const userValues = usersResult.rows.map((row, index) => {
        const isLast = index === usersResult.rows.length - 1;
        const domainValue = row.domain ? row.domain : 'NULL';
        const createdAt = row.created_at ? `'${row.created_at.toISOString()}'` : 'CURRENT_TIMESTAMP';
        return `  (${row.id}, '${row.username.replace(/'/g, "''")}', '${row.email.replace(/'/g, "''")}', '${row.password}', '${row.role}', ${domainValue}, ${createdAt})${isLast ? ';' : ','}`;
      }).join('\n');
      exportContent += userValues + '\n\n';
    }

    // Extract news data
    console.log('Extracting news data...');
    const newsResult = await client.query('SELECT * FROM news ORDER BY id');
    if (newsResult.rows.length > 0) {
      exportContent += '-- Insert news articles\n';
      exportContent += 'INSERT INTO news (id, title, domain, content, author_id, date) VALUES\n';
      const newsValues = newsResult.rows.map((row, index) => {
        const isLast = index === newsResult.rows.length - 1;
        const authorIdValue = row.author_id ? row.author_id : 'NULL';
        return `  (${row.id}, '${row.title.replace(/'/g, "''")}', ${row.domain}, '${row.content.replace(/'/g, "''")}', ${authorIdValue}, '${row.date}')${isLast ? ';' : ','}`;
      }).join('\n');
      exportContent += newsValues + '\n\n';
    }

    // Extract subscribers data
    console.log('Extracting subscribers data...');
    const subscribersResult = await client.query('SELECT * FROM subscribers ORDER BY id');
    if (subscribersResult.rows.length > 0) {
      exportContent += '-- Insert subscribers\n';
      exportContent += 'INSERT INTO subscribers (id, email, name, subscribed_at) VALUES\n';
      const subscriberValues = subscribersResult.rows.map((row, index) => {
        const isLast = index === subscribersResult.rows.length - 1;
        const nameValue = row.name ? `'${row.name.replace(/'/g, "''")}'` : 'NULL';
        const subscribedAtValue = row.subscribed_at ? `'${row.subscribed_at.toISOString()}'` : 'CURRENT_TIMESTAMP';
        return `  (${row.id}, '${row.email.replace(/'/g, "''")}', ${nameValue}, ${subscribedAtValue})${isLast ? ';' : ','}`;
      }).join('\n');
      exportContent += subscriberValues + '\n\n';
    }

    // Extract audit_log data (if table exists)
    console.log('Extracting audit log data...');
    try {
      const auditLogResult = await client.query('SELECT * FROM audit_log ORDER BY id');
      if (auditLogResult.rows.length > 0) {
        exportContent += '-- Insert audit log entries\n';
        exportContent += 'INSERT INTO audit_log (id, user_id, action, timestamp, ip_address, user_agent) VALUES\n';
        const auditLogValues = auditLogResult.rows.map((row, index) => {
          const isLast = index === auditLogResult.rows.length - 1;
          const userIdValue = row.user_id ? row.user_id : 'NULL';
          const ipAddressValue = row.ip_address ? `'${row.ip_address.replace(/'/g, "''")}'` : 'NULL';
          const userAgentValue = row.user_agent ? `'${row.user_agent.replace(/'/g, "''")}'` : 'NULL';
          return `  (${row.id}, ${userIdValue}, '${row.action.replace(/'/g, "''")}', '${row.timestamp.toISOString()}', ${ipAddressValue}, ${userAgentValue})${isLast ? ';' : ','}`;
        }).join('\n');
        exportContent += auditLogValues + '\n\n';
      }
    } catch (err) {
      if (err.code === '42P01') {
        console.log('Audit log table does not exist yet, skipping...');
      } else {
        throw err;
      }
    }

    // Add sequence resets
    exportContent += `-- Reset sequences to ensure new inserts continue from the correct point
SELECT setval(pg_get_serial_sequence('domains', 'id'), (SELECT MAX(id) FROM domains));
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('news', 'id'), (SELECT MAX(id) FROM news));
SELECT setval(pg_get_serial_sequence('subscribers', 'id'), (SELECT MAX(id) FROM subscribers));
SELECT setval(pg_get_serial_sequence('audit_log', 'id'), (SELECT MAX(id) FROM audit_log));

`;

    // Add notes
    exportContent += `-- Notes:
-- 1. All passwords in this file are properly hashed using bcrypt
-- 2. This export contains the complete current state of the database
-- 3. Domain references now use integer IDs instead of names for referential integrity
-- 4. This file should NOT be committed to version control for security reasons
`;

    // Write to file
    const outputPath = path.join(__dirname, '..', 'export-database-current.sql');
    fs.writeFileSync(outputPath, exportContent);
    console.log(`✅ Database export completed successfully`);
    console.log(`📁 Export saved to: ${outputPath}`);
    console.log(`📊 Export contains:`);
    console.log(`   - ${domainsResult.rows.length} domains`);
    console.log(`   - ${usersResult.rows.length} users`);
    console.log(`   - ${newsResult.rows.length} news articles`);
    console.log(`   - ${subscribersResult.rows.length} subscribers`);

  } catch (err) {
    console.error('❌ Error extracting database:', err);
  } finally {
    await client.end();
    console.log('🔒 Database connection closed');
  }
}

// Run the extraction
extractDatabase();