-- Database export script for newsletter_app (Local Development Version)
-- This script can be used to recreate the database structure and data for local development
-- Passwords are properly hashed using bcrypt for security

-- Create database (uncomment if needed)
-- CREATE DATABASE newsletter_app WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';

-- Connect to database (uncomment if needed)
-- \c newsletter_app;

-- Drop existing tables if they exist (for clean slate)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS domains CASCADE;

-- Create domains table
CREATE TABLE domains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(50) NOT NULL
);

-- Create users table (using integer domain IDs)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  domain INTEGER REFERENCES domains(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create news table (using integer domain IDs)
CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  domain INTEGER NOT NULL REFERENCES domains(id),
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  author_id INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create subscribers table
CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100),
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table for connection/disconnection tracking
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert domains
INSERT INTO domains (id, name, color) VALUES
  (1, 'Hiring', '#3b82f6'),
  (2, 'Event', '#8b5cf6'),
  (3, 'Journey', '#22c55e'),
  (4, 'Communication', '#f97316'),
  (5, 'Admin', '#ef4444');

-- Insert users with properly hashed passwords
-- All passwords are hashed using bcrypt with the value "admin123"
INSERT INTO users (id, username, email, password, role, domain) VALUES
  (1, 'admin', 'admin@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'admin', NULL),
  (2, 'hiring_manager', 'hiring@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'contributor', 1),
  (3, 'event_coordinator', 'events@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'contributor', 2),
  (4, 'journey_specialist', 'journey@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'contributor', 3),
  (5, 'communication_manager', 'comm@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'contributor', 4),
  (6, 'admin_contributor', 'admin.contributor@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'contributor', 5),
  (7, 'john_doe', 'john.doe@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'user', NULL),
  (8, 'jane_smith', 'jane.smith@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'user', NULL);

-- Insert subscribers
INSERT INTO subscribers (id, email, name) VALUES
  (1, 'alice.martin@example.com', 'Alice Martin'),
  (2, 'bob.wilson@example.com', 'Bob Wilson'),
  (3, 'carol.brown@example.com', 'Carol Brown'),
  (4, 'david.jones@example.com', 'David Jones'),
  (5, 'emma.davis@example.com', 'Emma Davis'),
  (6, 'frank.miller@example.com', 'Frank Miller'),
  (7, 'grace.taylor@example.com', 'Grace Taylor'),
  (8, 'henry.anderson@example.com', 'Henry Anderson');

-- Insert news articles
INSERT INTO news (id, title, domain, content, author, author_id, date) VALUES
  -- Hiring domain articles
  (1, 'We''re Hiring: Senior Software Engineers', 1, 'We are looking for talented Senior Software Engineers to join our growing team. We offer competitive salaries, flexible working hours, and the opportunity to work on cutting-edge projects. If you''re passionate about technology and innovation, we want to hear from you!', 'hiring_manager', 2, CURRENT_DATE - 5),
  (2, 'New Internship Program Launched', 1, 'We''re excited to announce our new internship program for students and recent graduates. This 6-month program offers hands-on experience, mentorship from industry experts, and potential full-time opportunities. Applications are now open!', 'hiring_manager', 2, CURRENT_DATE - 10),
  (3, 'Join Our Product Design Team', 1, 'We''re expanding our product design team and looking for creative minds who can help shape the future of our products. Experience with Figma, user research, and prototyping is a plus. Remote work options available.', 'hiring_manager', 2, CURRENT_DATE - 15),
  (4, 'Data Scientist Position Open', 1, 'Are you passionate about data and analytics? We''re seeking a Data Scientist to help us make data-driven decisions. You''ll work with large datasets, build predictive models, and collaborate with cross-functional teams.', 'hiring_manager', 2, CURRENT_DATE - 20),

  -- Event domain articles
  (5, 'Annual Company Conference 2025', 2, 'Save the date! Our annual company conference will be held on March 15-17, 2025. This year''s theme is "Innovation and Growth". Join us for keynote speeches, workshops, networking sessions, and team-building activities. Registration opens next week!', 'event_coordinator', 3, CURRENT_DATE - 3),
  (6, 'Tech Talk Series: AI and Machine Learning', 2, 'Join us for our monthly Tech Talk series! This month, we''re diving into AI and Machine Learning. Our guest speaker, Dr. Sarah Chen, will discuss the latest trends and practical applications. Thursday, 2 PM in the main auditorium.', 'event_coordinator', 3, CURRENT_DATE - 8),
  (7, 'Team Building Day - December 20th', 2, 'Mark your calendars! We''re organizing a team building day on December 20th. Activities include outdoor games, escape room challenges, and a festive dinner. It''s a great opportunity to bond with colleagues and have fun!', 'event_coordinator', 3, CURRENT_DATE - 12),
  (8, 'Virtual Happy Hour This Friday', 2, 'Join us for a virtual happy hour this Friday at 5 PM! It''s a casual event where you can unwind, chat with colleagues, and enjoy some fun games. Link will be shared in the company chat.', 'event_coordinator', 3, CURRENT_DATE - 18),

  -- Journey domain articles
  (9, 'Employee Journey: From Intern to Team Lead', 3, 'Meet Sarah Johnson, who started as an intern 5 years ago and is now a Team Lead. In this article, she shares her journey, challenges she overcame, and advice for those starting their careers. Her story is truly inspiring!', 'journey_specialist', 4, CURRENT_DATE - 2),
  (10, 'Career Development Program Updates', 3, 'We''ve updated our Career Development Program with new learning paths and mentorship opportunities. Whether you''re looking to advance in your current role or explore new areas, we have resources to support your growth.', 'journey_specialist', 4, CURRENT_DATE - 7),
  (11, 'New Learning Platform Launched', 3, 'We''re excited to introduce our new learning platform with over 500 courses covering technical skills, leadership, and personal development. All employees have free access. Start your learning journey today!', 'journey_specialist', 4, CURRENT_DATE - 14),
  (12, 'Celebrating 10 Years: Employee Milestones', 3, 'This month, we''re celebrating employees who have been with us for 10 years! Their dedication and contributions have been instrumental to our success. Read about their journeys and what keeps them motivated.', 'journey_specialist', 4, CURRENT_DATE - 22),

  -- Communication domain articles
  (13, 'New Internal Communication Platform', 4, 'We''re rolling out a new internal communication platform to improve collaboration and information sharing. The platform features instant messaging, video calls, file sharing, and project management tools. Training sessions start next week.', 'communication_manager', 5, CURRENT_DATE - 1),
  (14, 'Monthly Newsletter: December Edition', 4, 'Our December newsletter is out! This month''s highlights include Q4 achievements, upcoming events, employee spotlights, and important announcements. Check your inbox or visit the company portal to read the full newsletter.', 'communication_manager', 5, CURRENT_DATE - 6),
  (15, 'Improving Cross-Team Collaboration', 4, 'We''re implementing new processes to enhance cross-team collaboration. This includes regular sync meetings, shared documentation, and collaborative tools. Your feedback is valuable - please share your thoughts in the survey.', 'communication_manager', 5, CURRENT_DATE - 11),
  (16, 'CEO Town Hall - Key Takeaways', 4, 'Missed the CEO Town Hall? Here are the key takeaways: company vision for 2025, new strategic initiatives, Q&A highlights, and upcoming changes. Full recording available on the company portal.', 'communication_manager', 5, CURRENT_DATE - 16),

  -- Admin domain articles
  (17, 'IT Security Policy Updates', 5, 'Important: We''ve updated our IT security policies to enhance data protection. Key changes include mandatory two-factor authentication, new password requirements, and updated data handling procedures. Please review the policy document.', 'admin_contributor', 6, CURRENT_DATE - 4),
  (18, 'Office Maintenance Schedule', 5, 'Planned maintenance will be conducted in the main office building from December 10-12. Some areas will be temporarily inaccessible. Remote work is encouraged during this period. Detailed schedule available on the portal.', 'admin_contributor', 6, CURRENT_DATE - 9),
  (19, 'New Expense Reporting System', 5, 'We''re transitioning to a new expense reporting system for better efficiency and transparency. The new system offers mobile app support, automated approvals, and real-time tracking. Migration begins January 1st.', 'admin_contributor', 6, CURRENT_DATE - 13),
  (20, 'Updated Remote Work Policy', 5, 'Based on employee feedback, we''ve updated our remote work policy. Employees can now work remotely up to 3 days per week with manager approval. Full policy details and request forms are available on HR portal.', 'admin_contributor', 6, CURRENT_DATE - 19);

-- Reset sequences to ensure new inserts continue from the correct point
SELECT setval(pg_get_serial_sequence('domains', 'id'), (SELECT MAX(id) FROM domains));
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('news', 'id'), (SELECT MAX(id) FROM news));
SELECT setval(pg_get_serial_sequence('subscribers', 'id'), (SELECT MAX(id) FROM subscribers));
SELECT setval(pg_get_serial_sequence('audit_log', 'id'), (SELECT MAX(id) FROM audit_log));

-- Notes for local development:
-- 1. All passwords in this file are hashed using bcrypt with 12 rounds
-- 2. The default password for all accounts is "admin123"
-- 3. Domain references are now using integer IDs instead of names
-- 4. This version is compatible with the current application schema