-- Newsletter App - Production Database Restoration Script
-- This script restores the database with properly hashed passwords for production use

-- IMPORTANT: This script assumes you have already created the database
-- Run this script using: psql -h YOUR_HOST -p YOUR_PORT -U YOUR_USER -d newsletter_app -f restore-production-db.sql

\echo '=== Starting Newsletter App Production Database Restoration ==='

-- Connect to the database
\c newsletter_app

-- Disable foreign key checks temporarily to avoid constraint issues during import
SET session_replication_role = replica;

-- Clear existing data (if any) to ensure clean state
DELETE FROM audit_log;
DELETE FROM subscribers;
DELETE FROM news;
DELETE FROM users;
DELETE FROM domains;

-- Reset sequences
SELECT setval('domains_id_seq', 1, false);
SELECT setval('users_id_seq', 1, false);
SELECT setval('news_id_seq', 1, false);
SELECT setval('subscribers_id_seq', 1, false);
SELECT setval('audit_log_id_seq', 1, false);

\echo 'Cleared existing data and reset sequences'

-- Insert domains
INSERT INTO domains (id, name, color) VALUES
(1, 'Hiring', '#3b82f6'),
(2, 'Event', '#10b981'),
(3, 'Journey', '#8b5cf6'),
(4, 'Communication', '#f59e0b'),
(5, 'Admin', '#ef4444');

-- Update domains sequence
SELECT setval('domains_id_seq', (SELECT MAX(id) FROM domains));

\echo 'Inserted domains data'

-- Insert users with properly hashed passwords
-- All passwords are hashed using bcrypt with value "admin123"
INSERT INTO users (id, username, email, password, role, domain) VALUES
(1, 'admin', 'admin@company.com', '$2b$12$P06eJDZcn5mp7RBP6n6NA.Hks36zKd.e.nmA9CJ8NCZgFqlRopSqG', 'admin', NULL),
(2, 'hiring_manager', 'hiring@company.com', '$2b$12$P06eJDZcn5mp7RBP6n6NA.Hks36zKd.e.nmA9CJ8NCZgFqlRopSqG', 'contributor', 1),
(3, 'event_coordinator', 'events@company.com', '$2b$12$P06eJDZcn5mp7RBP6n6NA.Hks36zKd.e.nmA9CJ8NCZgFqlRopSqG', 'contributor', 2),
(4, 'journey_specialist', 'journey@company.com', '$2b$12$P06eJDZcn5mp7RBP6n6NA.Hks36zKd.e.nmA9CJ8NCZgFqlRopSqG', 'contributor', 3),
(5, 'communication_manager', 'comm@company.com', '$2b$12$P06eJDZcn5mp7RBP6n6NA.Hks36zKd.e.nmA9CJ8NCZgFqlRopSqG', 'contributor', 4),
(6, 'admin_contributor', 'admin.contributor@company.com', '$2b$12$P06eJDZcn5mp7RBP6n6NA.Hks36zKd.e.nmA9CJ8NCZgFqlRopSqG', 'contributor', 5),
(7, 'john_doe', 'john.doe@company.com', '$2b$12$P06eJDZcn5mp7RBP6n6NA.Hks36zKd.e.nmA9CJ8NCZgFqlRopSqG', 'user', NULL),
(8, 'jane_smith', 'jane.smith@company.com', '$2b$12$P06eJDZcn5mp7RBP6n6NA.Hks36zKd.e.nmA9CJ8NCZgFqlRopSqG', 'user', NULL);

-- Update users sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

\echo 'Inserted users data with hashed passwords'

-- Insert sample news articles
INSERT INTO news (id, title, domain, content, author, date) VALUES
(1, 'Welcome to Our Company!', 2, 'We are excited to welcome you to our company. This is a sample announcement for all employees.', 'admin', CURRENT_DATE),
(2, 'New Hiring Initiative', 1, 'We are launching a new hiring initiative to bring talented individuals to our team. Check the careers page for open positions.', 'hiring_manager', CURRENT_DATE),
(3, 'Annual Company Event', 2, 'Mark your calendars for our annual company event. This year promises to be bigger and better than ever!', 'event_coordinator', CURRENT_DATE);

-- Update news sequence
SELECT setval('news_id_seq', (SELECT MAX(id) FROM news));

\echo 'Inserted sample news articles'

-- Insert sample subscribers
INSERT INTO subscribers (id, email, name) VALUES
(1, 'subscriber1@example.com', 'Subscriber One'),
(2, 'subscriber2@example.com', 'Subscriber Two');

-- Update subscribers sequence
SELECT setval('subscribers_id_seq', (SELECT MAX(id) FROM subscribers));

\echo 'Inserted sample subscribers'

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

\echo '=== Database restoration completed successfully ==='
\echo ''
\echo 'IMPORTANT SECURITY NOTICE:'
\echo 'Default passwords have been set for all users.'
\echo 'Please change all user passwords immediately in production!'
\echo 'Use the admin account to manage other user accounts.'