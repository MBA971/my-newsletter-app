import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import config from './config/config.js';

// Database connection
const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,
    password: config.db.password,
    port: config.db.port,
});

// User data with plain text passwords (will be hashed)
const users = [
    // Super Admin user
    {
        username: 'admin',
        email: 'admin@company.com',
        password: 'admin123',
        role: 'super_admin',
        domain: null
    },
    // Contributor users
    {
        username: 'hiring_manager',
        email: 'hiring@company.com',
        password: 'hiring123',
        role: 'contributor',
        domain: 'Hiring'
    },
    {
        username: 'event_coordinator',
        email: 'events@company.com',
        password: 'event123',
        role: 'contributor',
        domain: 'Event'
    },
    {
        username: 'journey_specialist',
        email: 'journey@company.com',
        password: 'journey123',
        role: 'contributor',
        domain: 'Journey'
    },
    {
        username: 'communication_manager',
        email: 'comm@company.com',
        password: 'comm123',
        role: 'contributor',
        domain: 'Communication'
    },
    {
        username: 'admin_contributor',
        email: 'admin.contributor@company.com',
        password: 'admin.contrib123',
        role: 'contributor',
        domain: 'Admin'
    },
    // Regular users
    {
        username: 'john_doe',
        email: 'john.doe@company.com',
        password: 'user123',
        role: 'user',
        domain: null
    },
    {
        username: 'jane_smith',
        email: 'jane.smith@company.com',
        password: 'user123',
        role: 'user',
        domain: null
    }
];

// Domain data
const domains = [
    { name: 'Hiring', color: '#3b82f6' },
    { name: 'Event', color: '#8b5cf6' },
    { name: 'Journey', color: '#22c55e' },
    { name: 'Communication', color: '#f97316' },
    { name: 'Admin', color: '#ef4444' }
];

async function initDatabase() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        // Clear existing data
        console.log('Clearing existing data...');
        await client.query('DELETE FROM news');
        await client.query('DELETE FROM subscribers');
        await client.query('DELETE FROM users');
        await client.query('DELETE FROM domains');

        // Create indexes for performance (Optimize Version)
        console.log('Creating database indexes...');
        await client.query('CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_news_domain ON news(domain)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_news_date ON news(date)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_domain_id ON users(domain_id)');
        console.log('✅ Indexes created successfully');

        // Insert domains
        console.log('Inserting domains...');
        for (const domain of domains) {
            await client.query(
                'INSERT INTO domains (name, color) VALUES ($1, $2)',
                [domain.name, domain.color]
            );
        }

        // First, get domain IDs
        console.log('Getting domain IDs...');
        const domainResults = await client.query('SELECT id, name FROM domains');
        const domainMap = {};
        domainResults.rows.forEach(row => {
            domainMap[row.name] = row.id;
        });
        console.log('Domain map:', domainMap);

        // Insert users with hashed passwords
        console.log('Inserting users with hashed passwords...');
        const saltRounds = config.jwt.rounds;

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);
            const domainId = user.domain ? domainMap[user.domain] : null;
            await client.query(
                'INSERT INTO users (username, email, password, role, domain_id) VALUES ($1, $2, $3, $4, $5)',
                [user.username, user.email, hashedPassword, user.role, domainId]
            );
            console.log(`✓ Created user: ${user.username} (${user.email}) with role ${user.role}`);
        }

        // Insert sample subscribers
        console.log('Inserting sample subscribers...');
        const subscribers = [
            { email: 'alice.martin@example.com', name: 'Alice Martin' },
            { email: 'bob.wilson@example.com', name: 'Bob Wilson' },
            { email: 'carol.brown@example.com', name: 'Carol Brown' },
            { email: 'david.jones@example.com', name: 'David Jones' },
            { email: 'emma.davis@example.com', name: 'Emma Davis' },
            { email: 'frank.miller@example.com', name: 'Frank Miller' },
            { email: 'grace.taylor@example.com', name: 'Grace Taylor' },
            { email: 'henry.anderson@example.com', name: 'Henry Anderson' }
        ];

        for (const subscriber of subscribers) {
            await client.query(
                'INSERT INTO subscribers (email, name) VALUES ($1, $2)',
                [subscriber.email, subscriber.name]
            );
        }

        // Insert sample news articles
        console.log('Inserting sample news articles...');
        const newsArticles = [
            // Hiring domain articles
            {
                title: "We're Hiring: Senior Software Engineers",
                domain: "Hiring",
                content: "We are looking for talented Senior Software Engineers to join our growing team. We offer competitive salaries, flexible working hours, and the opportunity to work on cutting-edge projects. If you're passionate about technology and innovation, we want to hear from you!",
                author: "hiring_manager",
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                title: "New Internship Program Launched",
                domain: "Hiring",
                content: "We're excited to announce our new internship program for students and recent graduates. This 6-month program offers hands-on experience, mentorship from industry experts, and potential full-time opportunities. Applications are now open!",
                author: "hiring_manager",
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            },
            // Event domain articles
            {
                title: "Annual Company Conference 2025",
                domain: "Event",
                content: "Save the date! Our annual company conference will be held on March 15-17, 2025. This year's theme is \"Innovation and Growth\". Join us for keynote speeches, workshops, networking sessions, and team-building activities. Registration opens next week!",
                author: "event_coordinator",
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                title: "Tech Talk Series: AI and Machine Learning",
                domain: "Event",
                content: "Join us for our monthly Tech Talk series! This month, we're diving into AI and Machine Learning. Our guest speaker, Dr. Sarah Chen, will discuss the latest trends and practical applications. Thursday, 2 PM in the main auditorium.",
                author: "event_coordinator",
                date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            },
            // Journey domain articles
            {
                title: "Employee Journey: From Intern to Team Lead",
                domain: "Journey",
                content: "Meet Sarah Johnson, who started as an intern 5 years ago and is now a Team Lead. In this article, she shares her journey, challenges she overcame, and advice for those starting their careers. Her story is truly inspiring!",
                author: "journey_specialist",
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            // Communication domain articles
            {
                title: "New Internal Communication Platform",
                domain: "Communication",
                content: "We're rolling out a new internal communication platform to improve collaboration and information sharing. The platform features instant messaging, video calls, file sharing, and project management tools. Training sessions start next week.",
                author: "communication_manager",
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            // Admin domain articles
            {
                title: "IT Security Policy Updates",
                domain: "Admin",
                content: "Important: We've updated our IT security policies to enhance data protection. Key changes include mandatory two-factor authentication, new password requirements, and updated data handling procedures. Please review the policy document.",
                author: "admin_contributor",
                date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            }
        ];

        for (const article of newsArticles) {
            const domainId = domainMap[article.domain];
            // Get author ID
            const authorResult = await client.query('SELECT id FROM users WHERE username = $1', [article.author]);
            const authorId = authorResult.rows.length > 0 ? authorResult.rows[0].id : null;
            await client.query(
                'INSERT INTO news (title, domain, content, author_id, date) VALUES ($1, $2, $3, $4, $5)',
                [article.title, domainId, article.content, authorId, article.date]
            );
        }

        client.release();
        console.log('✅ Database initialized successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('   Admin: admin@company.com / admin123');
        console.log('   Hiring: hiring@company.com / hiring123');
        console.log('   Events: events@company.com / event123');
        console.log('   Journey: journey@company.com / journey123');
        console.log('   Communication: comm@company.com / comm123');
        console.log('   Admin Contributor: admin.contributor@company.com / admin.contrib123');
        console.log('   Regular Users: john.doe@company.com / user123 or jane.smith@company.com / user123');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the initialization
initDatabase();