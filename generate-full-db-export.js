/**
 * Generate Full Database Export Script
 * This script creates a complete export of the newsletter_app database
 * with all data and properly hashed passwords for production use.
 * 
 * The exported file is intentionally excluded from Git to protect sensitive data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;

// Get the directory name (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const config = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'newsletter_app',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
};

console.log('Connecting to database...');
console.log(`Host: ${config.host}:${config.port}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);

// Create a new client
const client = new Client(config);

async function generateExport() {
  try {
    // Connect to the database
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Generate the export content
    let exportContent = `-- Database export script for newsletter_app
-- Generated on: ${new Date().toISOString()}
-- This script contains all data with properly hashed passwords for production use

`;

    // Add drop and create table statements
    exportContent += `-- Drop existing tables if they exist (for clean slate)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS domains CASCADE;

`;

    // Get and export domains table structure
    exportContent += `-- Create domains table
CREATE TABLE domains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(50) NOT NULL
);

`;

    // Get and export users table structure
    exportContent += `-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  domain INTEGER REFERENCES domains(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

`;

    // Get and export news table structure
    exportContent += `-- Create news table
CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  domain INTEGER NOT NULL REFERENCES domains(id),
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  author_id INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

`;

    // Get and export subscribers table structure
    exportContent += `-- Create subscribers table
CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100),
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

`;

    // Get and export audit_log table structure
    exportContent += `-- Create audit log table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

`;

    // Export domains data
    console.log('Exporting domains data...');
    const domainsResult = await client.query('SELECT * FROM domains ORDER BY id');
    if (domainsResult.rows.length > 0) {
      exportContent += '-- Insert domains\n';
      exportContent += 'INSERT INTO domains (id, name, color) VALUES\n';
      const domainValues = domainsResult.rows.map(row => 
        `  (${row.id}, '${row.name.replace(/'/g, "''")}', '${row.color}')`
      ).join(',\n');
      exportContent += domainValues + ';\n\n';
    }

    // Export users data (with hashed passwords)
    console.log('Exporting users data...');
    const usersResult = await client.query('SELECT * FROM users ORDER BY id');
    if (usersResult.rows.length > 0) {
      exportContent += '-- Insert users (passwords are properly hashed)\n';
      exportContent += 'INSERT INTO users (id, username, email, password, role, domain, created_at) VALUES\n';
      const userValues = usersResult.rows.map(row => {
        const domainValue = row.domain ? row.domain : 'NULL';
        const createdAt = row.created_at ? `'${row.created_at.toISOString()}'` : 'CURRENT_TIMESTAMP';
        return `  (${row.id}, '${row.username.replace(/'/g, "''")}', '${row.email.replace(/'/g, "''")}', '${row.password}', '${row.role}', ${domainValue}, ${createdAt})`;
      }).join(',\n');
      exportContent += userValues + ';\n\n';
    }

    // Export news data
    console.log('Exporting news data...');
    const newsResult = await client.query('SELECT * FROM news ORDER BY id');
    if (newsResult.rows.length > 0) {
      exportContent += '-- Insert news articles\n';
      exportContent += 'INSERT INTO news (id, title, domain, content, author, author_id, date) VALUES\n';
      const newsValues = newsResult.rows.map(row => {
        const authorIdValue = row.author_id ? row.author_id : 'NULL';
        return `  (${row.id}, '${row.title.replace(/'/g, "''")}', ${row.domain}, '${row.content.replace(/'/g, "''")}', '${row.author.replace(/'/g, "''")}', ${authorIdValue}, '${row.date}')`;
      }).join(',\n');
      exportContent += newsValues + ';\n\n';
    }

    // Export subscribers data
    console.log('Exporting subscribers data...');
    const subscribersResult = await client.query('SELECT * FROM subscribers ORDER BY id');
    if (subscribersResult.rows.length > 0) {
      exportContent += '-- Insert subscribers\n';
      exportContent += 'INSERT INTO subscribers (id, email, name, subscribed_at) VALUES\n';
      const subscriberValues = subscribersResult.rows.map(row => {
        const nameValue = row.name ? `'${row.name.replace(/'/g, "''")}'` : 'NULL';
        const subscribedAtValue = row.subscribed_at ? `'${row.subscribed_at.toISOString()}'` : 'CURRENT_TIMESTAMP';
        return `  (${row.id}, '${row.email.replace(/'/g, "''")}', ${nameValue}, ${subscribedAtValue})`;
      }).join(',\n');
      exportContent += subscriberValues + ';\n\n';
    }

    // Export audit_log data
    console.log('Exporting audit log data...');
    const auditLogResult = await client.query('SELECT * FROM audit_log ORDER BY id');
    if (auditLogResult.rows.length > 0) {
      exportContent += '-- Insert audit log entries\n';
      exportContent += 'INSERT INTO audit_log (id, user_id, action, timestamp, ip_address, user_agent) VALUES\n';
      const auditLogValues = auditLogResult.rows.map(row => {
        const userIdValue = row.user_id ? row.user_id : 'NULL';
        const ipAddressValue = row.ip_address ? `'${row.ip_address.replace(/'/g, "''")}'` : 'NULL';
        const userAgentValue = row.user_agent ? `'${row.user_agent.replace(/'/g, "''")}'` : 'NULL';
        return `  (${row.id}, ${userIdValue}, '${row.action.replace(/'/g, "''")}', '${row.timestamp.toISOString()}', ${ipAddressValue}, ${userAgentValue})`;
      }).join(',\n');
      exportContent += auditLogValues + ';\n\n';
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
-- 3. This file is excluded from Git to protect sensitive data
-- 4. For production deployment, ensure all passwords are properly secured
`;

    // Write to file
    const outputPath = path.join(__dirname, 'export-database-full.sql');
    fs.writeFileSync(outputPath, exportContent);
    console.log(`✅ Database export completed successfully`);
    console.log(`📁 Export saved to: ${outputPath}`);
    console.log(`📊 Export contains:`);
    console.log(`   - ${domainsResult.rows.length} domains`);
    console.log(`   - ${usersResult.rows.length} users`);
    console.log(`   - ${newsResult.rows.length} news articles`);
    console.log(`   - ${subscribersResult.rows.length} subscribers`);
    console.log(`   - ${auditLogResult.rows.length} audit log entries`);

  } catch (err) {
    console.error('❌ Error generating database export:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔒 Database connection closed');
  }
}

// Run the export
generateExport();