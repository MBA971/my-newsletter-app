import pool from '../utils/database.js';

// Create tables if they don't exist
export const createTables = async () => {
    try {
        // Create domains table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS domains (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        color VARCHAR(50) NOT NULL
      )
    `);

        // Create users table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        domain_id INTEGER, -- Reference to domains.id
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (domain_id) REFERENCES domains(id)
      )
    `);

        // Create news table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        domain INTEGER NOT NULL, -- Reference to domains.id
        content TEXT NOT NULL,
        author_id INTEGER, -- Reference to users.id
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        editors TEXT[] DEFAULT '{}', -- Store emails of users who can edit this article
        likes_count INTEGER DEFAULT 0,
        archived BOOLEAN DEFAULT FALSE,
        pending_validation BOOLEAN DEFAULT FALSE,
        validated_by INTEGER, -- Reference to users.id
        validated_at TIMESTAMP,
        FOREIGN KEY (domain) REFERENCES domains(id),
        FOREIGN KEY (author_id) REFERENCES users(id),
        FOREIGN KEY (validated_by) REFERENCES users(id)
      )
    `);

        // Create subscribers table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100),
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create audit log table for connection/disconnection tracking
        await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(50) NOT NULL, -- 'login', 'logout'
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

        // Create likes table for tracking article likes
        await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        news_id INTEGER NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
      )
    `);

        console.log('Tables created successfully');
    } catch (err) {
        console.error('Error creating tables:', err);
        throw err;
    }
};