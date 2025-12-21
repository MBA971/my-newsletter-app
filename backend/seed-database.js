// Script to reset and seed the database with new data
// Run with: node seed-database.js

import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newsletter_app',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5433,  // Changed from 5432 to 5433 to match docker-compose
});

async function resetAndSeedDatabase() {
    try {
        console.log('🗑️  Clearing existing data...');

        // Delete all existing data
        await pool.query('DELETE FROM news');
        await pool.query('DELETE FROM subscribers');
        await pool.query('DELETE FROM users');
        await pool.query('DELETE FROM domains');

        console.log('✅ Existing data cleared');
        console.log('📝 Inserting new data...');

        // Define domains with their colors
        const domains = [
            { name: 'Hiring', color: '#3b82f6' },      // Blue
            { name: 'Event', color: '#8b5cf6' },       // Purple
            { name: 'Journey', color: '#22c55e' },     // Green
            { name: 'Communication', color: '#f97316' }, // Orange
            { name: 'Admin', color: '#ef4444' }        // Red
        ];

        // Insert domains and store their IDs
        console.log('  🏢 Inserting domains...');
        const domainIds = {};
        for (const domain of domains) {
            const result = await pool.query(
                'INSERT INTO domains (name, color) VALUES ($1, $2) RETURNING id',
                [domain.name, domain.color]
            );
            domainIds[domain.name] = result.rows[0].id;
            console.log(`    ✅ ${domain.name} (ID: ${domainIds[domain.name]})`);
        }
        console.log(`  ✅ ${domains.length} domains inserted`);

        // Insert users
        const users = [
            // Contributors - one per domain
            { username: 'hiring_manager', email: 'hiring@company.com', password: 'hiring123', role: 'contributor', domain: domainIds['Hiring'] },
            { username: 'event_coordinator', email: 'events@company.com', password: 'event123', role: 'contributor', domain: domainIds['Event'] },
            { username: 'journey_specialist', email: 'journey@company.com', password: 'journey123', role: 'contributor', domain: domainIds['Journey'] },
            { username: 'communication_manager', email: 'comm@company.com', password: 'comm123', role: 'contributor', domain: domainIds['Communication'] },
            { username: 'admin_contributor', email: 'admin.contributor@company.com', password: 'admin.contrib123', role: 'contributor', domain: domainIds['Admin'] },

            // Admin user - can manage everything
            { username: 'admin', email: 'admin@company.com', password: 'admin123', role: 'admin', domain: null },

            // Regular users
            { username: 'john_doe', email: 'john.doe@company.com', password: 'user123', role: 'user', domain: null },
            { username: 'jane_smith', email: 'jane.smith@company.com', password: 'user123', role: 'user', domain: null }
        ];

        console.log('  👥 Inserting users...');
        for (const user of users) {
            // Hash the password before inserting
            const hashedPassword = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
            await pool.query(
                'INSERT INTO users (username, email, password, role, domain_id) VALUES ($1, $2, $3, $4, $5)',
                [user.username, user.email, hashedPassword, user.role, user.domain]
            );
        }
        console.log(`  ✅ ${users.length} users inserted`);

        // Insert subscribers
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

        console.log('  📧 Inserting subscribers...');
        for (const subscriber of subscribers) {
            await pool.query(
                'INSERT INTO subscribers (email, name) VALUES ($1, $2)',
                [subscriber.email, subscriber.name]
            );
        }
        console.log(`  ✅ ${subscribers.length} subscribers inserted`);

        // Insert news articles
        const news = [
            // Hiring domain articles (4 articles)
            {
                title: 'We\'re Hiring: Senior Software Engineers',
                domain: domainIds['Hiring'],
                content: 'We are looking for talented Senior Software Engineers to join our growing team. We offer competitive salaries, flexible working hours, and the opportunity to work on cutting-edge projects. If you\'re passionate about technology and innovation, we want to hear from you!',
                author: 'hiring_manager'
            },
            {
                title: 'New Internship Program Launched',
                domain: domainIds['Hiring'],
                content: 'We\'re excited to announce our new internship program for students and recent graduates. This 6-month program offers hands-on experience, mentorship from industry experts, and potential full-time opportunities. Applications are now open!',
                author: 'hiring_manager'
            },
            {
                title: 'Join Our Product Design Team',
                domain: domainIds['Hiring'],
                content: 'We\'re expanding our product design team and looking for creative minds who can help shape the future of our products. Experience with Figma, user research, and prototyping is a plus. Remote work options available.',
                author: 'hiring_manager'
            },
            {
                title: 'Data Scientist Position Open',
                domain: domainIds['Hiring'],
                content: 'Are you passionate about data and analytics? We\'re seeking a Data Scientist to help us make data-driven decisions. You\'ll work with large datasets, build predictive models, and collaborate with cross-functional teams.',
                author: 'hiring_manager'
            },

            // Event domain articles (4 articles)
            {
                title: 'Annual Company Conference 2025',
                domain: domainIds['Event'],
                content: 'Save the date! Our annual company conference will be held on March 15-17, 2025. This year\'s theme is "Innovation and Growth". Join us for keynote speeches, workshops, networking sessions, and team-building activities. Registration opens next week!',
                author: 'event_coordinator'
            },
            {
                title: 'Tech Talk Series: AI and Machine Learning',
                domain: domainIds['Event'],
                content: 'Join us for our monthly Tech Talk series! This month, we\'re diving into AI and Machine Learning. Our guest speaker, Dr. Sarah Chen, will discuss the latest trends and practical applications. Thursday, 2 PM in the main auditorium.',
                author: 'event_coordinator'
            },
            {
                title: 'Team Building Day - December 20th',
                domain: domainIds['Event'],
                content: 'Mark your calendars! We\'re organizing a team building day on December 20th. Activities include outdoor games, escape room challenges, and a festive dinner. It\'s a great opportunity to bond with colleagues and have fun!',
                author: 'event_coordinator'
            },
            {
                title: 'Virtual Happy Hour This Friday',
                domain: domainIds['Event'],
                content: 'Join us for a virtual happy hour this Friday at 5 PM! It\'s a casual event where you can unwind, chat with colleagues, and enjoy some fun games. Link will be shared in the company chat.',
                author: 'event_coordinator'
            },

            // Journey domain articles (4 articles)
            {
                title: 'Employee Journey: From Intern to Team Lead',
                domain: domainIds['Journey'],
                content: 'Meet Sarah Johnson, who started as an intern 5 years ago and is now a Team Lead. In this article, she shares her journey, challenges she overcame, and advice for those starting their careers. Her story is truly inspiring!',
                author: 'journey_specialist'
            },
            {
                title: 'Career Development Program Updates',
                domain: domainIds['Journey'],
                content: 'We\'ve updated our Career Development Program with new learning paths and mentorship opportunities. Whether you\'re looking to advance in your current role or explore new areas, we have resources to support your growth.',
                author: 'journey_specialist'
            },
            {
                title: 'New Learning Platform Launched',
                domain: domainIds['Journey'],
                content: 'We\'re excited to introduce our new learning platform with over 500 courses covering technical skills, leadership, and personal development. All employees have free access. Start your learning journey today!',
                author: 'journey_specialist'
            },
            {
                title: 'Celebrating 10 Years: Employee Milestones',
                domain: domainIds['Journey'],
                content: 'This month, we\'re celebrating employees who have been with us for 10 years! Their dedication and contributions have been instrumental to our success. Read about their journeys and what keeps them motivated.',
                author: 'journey_specialist'
            },

            // Communication domain articles (4 articles)
            {
                title: 'New Internal Communication Platform',
                domain: domainIds['Communication'],
                content: 'We\'re rolling out a new internal communication platform to improve collaboration and information sharing. The platform features instant messaging, video calls, file sharing, and project management tools. Training sessions start next week.',
                author: 'communication_manager'
            },
            {
                title: 'Monthly Newsletter: December Edition',
                domain: domainIds['Communication'],
                content: 'Our December newsletter is out! This month\'s highlights include Q4 achievements, upcoming events, employee spotlights, and important announcements. Check your inbox or visit the company portal to read the full newsletter.',
                author: 'communication_manager'
            },
            {
                title: 'Improving Cross-Team Collaboration',
                domain: domainIds['Communication'],
                content: 'We\'re implementing new processes to enhance cross-team collaboration. This includes regular sync meetings, shared documentation, and collaborative tools. Your feedback is valuable - please share your thoughts in the survey.',
                author: 'communication_manager'
            },
            {
                title: 'CEO Town Hall - Key Takeaways',
                domain: domainIds['Communication'],
                content: 'Missed the CEO Town Hall? Here are the key takeaways: company vision for 2025, new strategic initiatives, Q&A highlights, and upcoming changes. Full recording available on the company portal.',
                author: 'communication_manager'
            },

            // Admin domain articles (4 articles)
            {
                title: 'IT Security Policy Updates',
                domain: domainIds['Admin'],
                content: 'Important: We\'ve updated our IT security policies to enhance data protection. Key changes include mandatory two-factor authentication, new password requirements, and updated data handling procedures. Please review the policy document.',
                author: 'admin_contributor'
            },
            {
                title: 'Office Maintenance Schedule',
                domain: domainIds['Admin'],
                content: 'Planned maintenance will be conducted in the main office building from December 10-12. Some areas will be temporarily inaccessible. Remote work is encouraged during this period. Detailed schedule available on the portal.',
                author: 'admin_contributor'
            },
            {
                title: 'New Expense Reporting System',
                domain: domainIds['Admin'],
                content: 'We\'re transitioning to a new expense reporting system for better efficiency and transparency. The new system offers mobile app support, automated approvals, and real-time tracking. Migration begins January 1st.',
                author: 'admin_contributor'
            },
            {
                title: 'Updated Remote Work Policy',
                domain: domainIds['Admin'],
                content: 'Based on employee feedback, we\'ve updated our remote work policy. Employees can now work remotely up to 3 days per week with manager approval. Full policy details and request forms are available on HR portal.',
                author: 'admin_contributor'
            }
        ];

        console.log('  📰 Inserting news articles...');
        for (const article of news) {
            // Random date within last 30 days
            const randomDays = Math.floor(Math.random() * 30);
            await pool.query(
                `INSERT INTO news (title, domain, content, author, date) 
                 VALUES ($1, $2, $3, $4, CURRENT_DATE - CAST($5 AS INTEGER))`,
                [article.title, article.domain, article.content, article.author, randomDays]
            );
        }
        console.log(`  ✅ ${news.length} articles inserted`);

        console.log('\n✨ Database seeded successfully!\n');
        console.log('📊 Summary:');
        console.log(`  - Domains: ${domains.length}`);
        console.log(`  - Users: ${users.length} (5 contributors + 1 admin + 2 regular users)`);
        console.log(`  - Subscribers: ${subscribers.length}`);
        console.log(`  - Articles: ${news.length} (4 per domain)`);
        console.log('\n🔑 Login credentials:');
        console.log('  Admin: admin@company.com / admin123');
        console.log('  Hiring: hiring@company.com / hiring123');
        console.log('  Event: events@company.com / event123');
        console.log('  Journey: journey@company.com / journey123');
        console.log('  Communication: comm@company.com / comm123');
        console.log('  Admin Contributor: admin.contributor@company.com / admin.contrib123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await pool.end();
    }
}

// Run the seeding
export const seedDatabase = async () => {
    try {
        await resetAndSeedDatabase();
    } catch (error) {
        console.error('Failed to seed database:', error);
        throw error;
    }
};

// Run if executed directly
if (process.argv[1] === import.meta.url || process.argv[1].endsWith('seed-database.js')) {
    resetAndSeedDatabase().then(() => pool.end());
}
