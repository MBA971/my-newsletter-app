// Script to completely reinitialize the database with fresh data
// Run with: node reinit-database.js

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function reinitializeDatabase() {
    try {
        console.log('🗑️  Dropping existing tables...');
        
        // Drop all tables
        await pool.query('DROP TABLE IF EXISTS news CASCADE');
        await pool.query('DROP TABLE IF EXISTS subscribers CASCADE');
        await pool.query('DROP TABLE IF EXISTS users CASCADE');
        await pool.query('DROP TABLE IF EXISTS domains CASCADE');
        await pool.query('DROP TABLE IF EXISTS audit_log CASCADE'); // For audit logging
        
        console.log('✅ Tables dropped');
        console.log('📝 Creating new tables...');
        
        // Create domains table
        await pool.query(`
            CREATE TABLE domains (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                color VARCHAR(50) NOT NULL
            )
        `);
        
        // Create users table
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                domain VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create news table
        await pool.query(`
            CREATE TABLE news (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                domain VARCHAR(100) NOT NULL,
                content TEXT NOT NULL,
                author VARCHAR(100) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                editors TEXT[] DEFAULT '{}', -- Store emails of users who can edit this article
                FOREIGN KEY (domain) REFERENCES domains(name)
            )
        `);
        
        // Create subscribers table
        await pool.query(`
            CREATE TABLE subscribers (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(100),
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create audit log table for connection/disconnection tracking
        await pool.query(`
            CREATE TABLE audit_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                action VARCHAR(50) NOT NULL, -- 'login', 'logout'
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        
        console.log('✅ Tables created');
        console.log('📝 Inserting fresh data...');
        
        // Insert sample domains
        const domains = [
            { name: 'Technology', color: '#3b82f6' },      // Blue
            { name: 'Business', color: '#22c55e' },        // Green
            { name: 'Design', color: '#a855f7' },          // Purple
            { name: 'Culture', color: '#f97316' },         // Orange
            { name: 'Science', color: '#ef4444' }          // Red
        ];
        
        console.log('  📁 Inserting domains...');
        for (const domain of domains) {
            await pool.query(
                'INSERT INTO domains (name, color) VALUES ($1, $2)',
                [domain.name, domain.color]
            );
        }
        console.log(`  ✅ ${domains.length} domains inserted`);
        
        // Insert sample users with bcrypt hashed passwords
        const users = [
            { username: 'tech_contributor', email: 'tech@company.com', password: '$2b$12$j9Qvfq8b4xqSYXYPDC.VSOaVuuyZJJ4PBIR5jbo.hPK3ILX1.e7qP', role: 'contributor', domain: 'Technology' }, // tech123
            { username: 'business_contributor', email: 'business@company.com', password: '$2b$12$BWqYobwr2UL/qVEgRr56he3FVVjc2i.WLH8eSU451fIEJ62ezVyes', role: 'contributor', domain: 'Business' }, // business123
            { username: 'design_contributor', email: 'design@company.com', password: '$2b$12$kAv0Gh88NDV8Q32wT.9LaOk0zzB5ldiXgX0tECKVWScari/gNjNZ', role: 'contributor', domain: 'Design' }, // design123
            { username: 'culture_contributor', email: 'culture@company.com', password: '$2b$12$Ura111Ku3htG2QK2a7fFsO2cooox3H.dH2BgXr6n5HD/UZkVH5jon', role: 'contributor', domain: 'Culture' }, // culture123
            { username: 'science_contributor', email: 'science@company.com', password: '$2b$12$OY48L4v1FpzKeatpCAL3nuOZQQeO6qo4hI.9sV/RMH02QepGK7FVG', role: 'contributor', domain: 'Science' }, // science123
            { username: 'admin', email: 'admin@company.com', password: '$2b$12$oDcThZdNk47dU.MigZnRoenzhhjNfj.5c8YFJ10mYwUG5iIF8oR2e', role: 'admin', domain: null }, // admin123
            { username: 'user1', email: 'user1@company.com', password: '$2b$12$VliR2lDk1.xrSrIo4E/dJuxo66ixFhwdSV8IsiZOGx9FLqvHMVrdB', role: 'user', domain: null }, // user123
            { username: 'user2', email: 'user2@company.com', password: '$2b$12$VliR2lDk1.xrSrIo4E/dJuxo66ixFhwdSV8IsiZOGx9FLqvHMVrdB', role: 'user', domain: null } // user123
        ];
        
        console.log('  👤 Inserting users...');
        for (const user of users) {
            await pool.query(
                'INSERT INTO users (username, email, password, role, domain) VALUES ($1, $2, $3, $4, $5)',
                [user.username, user.email, user.password, user.role, user.domain]
            );
        }
        console.log(`  ✅ ${users.length} users inserted`);
        
        // Insert sample subscribers
        const subscribers = [
            { email: 'subscriber1@example.com', name: 'John Doe' },
            { email: 'subscriber2@example.com', name: 'Jane Smith' },
            { email: 'subscriber3@example.com', name: 'Robert Johnson' },
            { email: 'subscriber4@example.com', name: 'Emily Davis' },
            { email: 'subscriber5@example.com', name: 'Michael Wilson' }
        ];
        
        console.log('  📧 Inserting subscribers...');
        for (const subscriber of subscribers) {
            await pool.query(
                'INSERT INTO subscribers (email, name) VALUES ($1, $2)',
                [subscriber.email, subscriber.name]
            );
        }
        console.log(`  ✅ ${subscribers.length} subscribers inserted`);
        
        // Insert sample news articles for each domain
        const news = [
            {
                title: 'New AI Breakthrough in Natural Language Processing',
                domain: 'Technology',
                content: 'Researchers have developed a new AI model that significantly improves natural language understanding. The model shows 40% better performance on benchmark tests compared to previous versions.',
                author: 'tech_contributor'
            },
            {
                title: 'Revolutionary Battery Technology Promises Week-Long Charge',
                domain: 'Technology',
                content: 'Scientists have announced a breakthrough in battery technology that could keep devices charged for up to a week. The new solid-state batteries are also safer and charge faster than current lithium-ion technology.',
                author: 'tech_contributor'
            },
            {
                title: 'Global Markets Reach All-Time High Amid Economic Recovery',
                domain: 'Business',
                content: 'Stock markets worldwide have reached unprecedented levels as economic indicators show strong recovery signals. Analysts predict continued growth through the next quarter.',
                author: 'business_contributor'
            },
            {
                title: 'Startup Funding Reaches Record Levels in Q3',
                domain: 'Business',
                content: 'Venture capital investments hit a new quarterly record, with over $50 billion invested in startups globally. The technology sector continues to attract the largest share of funding.',
                author: 'business_contributor'
            },
            {
                title: 'Minimalist Design Trends Take Over Modern Architecture',
                domain: 'Design',
                content: 'Architects are embracing minimalist principles, focusing on clean lines and sustainable materials. This trend is reshaping urban landscapes worldwide.',
                author: 'design_contributor'
            },
            {
                title: 'Color Theory Innovations in Digital Media',
                domain: 'Design',
                content: 'New research in color theory is influencing digital design practices, leading to more accessible and emotionally resonant user interfaces.',
                author: 'design_contributor'
            },
            {
                title: 'Cultural Exchange Programs See Surge in Participation',
                domain: 'Culture',
                content: 'International cultural exchange programs report a 40% increase in participants this year, fostering greater global understanding and cooperation.',
                author: 'culture_contributor'
            },
            {
                title: 'Digital Art Galleries Transform Museum Experience',
                domain: 'Culture',
                content: 'Museums worldwide are adopting virtual reality galleries, making art accessible to global audiences and creating immersive experiences.',
                author: 'culture_contributor'
            },
            {
                title: 'Discovery of New Exoplanet with Potential for Life',
                domain: 'Science',
                content: 'Astronomers have identified a new exoplanet in the habitable zone of its star system. Initial analysis suggests it may have conditions suitable for life as we know it.',
                author: 'science_contributor'
            },
            {
                title: 'Breakthrough in Quantum Computing Achieved',
                domain: 'Science',
                content: 'Scientists have successfully demonstrated quantum supremacy with a new processor that solves complex problems in minutes that would take traditional computers thousands of years.',
                author: 'science_contributor'
            }
        ];
        
        console.log('  📰 Inserting news articles...');
        for (const article of news) {
            await pool.query(
                'INSERT INTO news (title, domain, content, author, date) VALUES ($1, $2, $3, $4, CURRENT_DATE - CAST(RANDOM()*30 AS INTEGER))',
                [article.title, article.domain, article.content, article.author]
            );
        }
        console.log(`  ✅ ${news.length} news articles inserted`);
        
        console.log('🎉 Database reinitialized successfully!');
        console.log('\n📋 Test Credentials:');
        console.log('   Admin: admin@company.com / admin123');
        console.log('   Tech Contributor: tech@company.com / tech123');
        console.log('   Business Contributor: business@company.com / business123');
        console.log('   Design Contributor: design@company.com / design123');
        console.log('   Culture Contributor: culture@company.com / culture123');
        console.log('   Science Contributor: science@company.com / science123');
        console.log('   Regular User: user1@company.com / user123');
        
    } catch (err) {
        console.error('❌ Error reinitializing database:', err);
    } finally {
        await pool.end();
    }
}

reinitializeDatabase();