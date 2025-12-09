-- Database export script for newsletter_app (pgAdmin Compatible Version)
-- This script contains the current database structure and data with properly hashed passwords
-- Generated on: 2025-12-09

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
  (16, 'Hiring', '#3b82f6'),
  (17, 'Event', '#8b5cf6'),
  (18, 'Journey', '#22c55e'),
  (19, 'Communication', '#f97316'),
  (20, 'Admin', '#ef4444');

-- Insert users (passwords are properly hashed)
INSERT INTO users (id, username, email, password, role, domain, created_at) VALUES
  (25, 'hiring_managerb', 'hiring@company.com', '$2b$12$I/JQ0JKgAKSUDDpoYGabbOM7CBJNIgZgAG7H4eNMv6baPR0EHuLVW', 'contributor', 16, '2025-12-09T20:25:15.247Z'),
  (26, 'event_coordinators', 'events@company.com', '$2b$12$DWGHsRboi2cdqa7CiAurxuFU43hv3oTJfy.1YcWeyPkmyEmSIdVMK', 'contributor', 17, '2025-12-09T20:25:15.483Z'),
  (27, 'journey_specialist', 'journey@company.com', '$2b$12$KZ.fr2M7W/vWELZ5n.Rbvev3nJuj3nYonvHYCAQq8BKhDakL6xhDW', 'contributor', 18, '2025-12-09T20:25:15.726Z'),
  (28, 'communication_manager', 'comm@company.com', '$2b$12$EhGMn0jp66DRtuHY9nh9reVTRv6q2QFIbKMbmh1gIFzWiKbm4HRGW', 'contributor', 19, '2025-12-09T20:25:15.968Z'),
  (29, 'admin_contributor', 'admin.contributor@company.com', '$2b$12$MSPrTL774K3MM3Rw7Y0e4Ol6K0oQpfpRvhaurcfCl7O3.sEubItgu', 'contributor', 20, '2025-12-09T20:25:16.197Z'),
  (30, 'admin', 'admin@company.com', '$2b$12$P06eJDZcn5mp7RBP6n6NA.Hks36zKd.e.nmA9CJ8NCZgFqlRopSqG', 'admin', NULL, '2025-12-09T20:25:16.430Z'),
  (31, 'john_doe', 'john.doe@company.com', '$2b$12$j3xpZ/8O50lV1o26b98aDOFKm5i7h74Zi/HhdhZdqjRVEr1AaWDI.', 'user', NULL, '2025-12-09T20:25:16.713Z'),
  (32, 'jane_smith', 'jane.smith@company.com', '$2b$12$4rRKJOGkpRqiMn3rYpMjseBhe/pLv4E5m/J9dKnTVXmMz0QIfPb3S', 'user', NULL, '2025-12-09T20:25:16.972Z');

-- Insert news articles
INSERT INTO news (id, title, domain, content, author, author_id, date) VALUES
  (61, 'We''re Hiring: Senior Software Engineers', 16, 'We are looking for talented Senior Software Engineers to join our growing team. We offer competitive salaries, flexible working hours, and the opportunity to work on cutting-edge projects. If you''re passionate about technology and innovation, we want to hear from you!', 'hiring_manager', NULL, '2025-11-21'),
  (62, 'New Internship Program Launched', 16, 'We''re excited to announce our new internship program for students and recent graduates. This 6-month program offers hands-on experience, mentorship from industry experts, and potential full-time opportunities. Applications are now open!', 'hiring_manager', NULL, '2025-11-16'),
  (63, 'Join Our Product Design Team', 16, 'We''re expanding our product design team and looking for creative minds who can help shape the future of our products. Experience with Figma, user research, and prototyping is a plus. Remote work options available.', 'hiring_manager', NULL, '2025-11-15'),
  (64, 'Data Scientist Position Open', 16, 'Are you passionate about data and analytics? We''re seeking a Data Scientist to help us make data-driven decisions. You''ll work with large datasets, build predictive models, and collaborate with cross-functional teams.', 'hiring_manager', NULL, '2025-11-11'),
  (65, 'Annual Company Conference 2025', 17, 'Save the date! Our annual company conference will be held on March 15-17, 2025. This year''s theme is "Innovation and Growth". Join us for keynote speeches, workshops, networking sessions, and team-building activities. Registration opens next week!', 'event_coordinator', NULL, '2025-11-19'),
  (66, 'Tech Talk Series: AI and Machine Learning', 17, 'Join us for our monthly Tech Talk series! This month, we''re diving into AI and Machine Learning. Our guest speaker, Dr. Sarah Chen, will discuss the latest trends and practical applications. Thursday, 2 PM in the main auditorium.', 'event_coordinator', NULL, '2025-11-10'),
  (67, 'Team Building Day - December 20th', 17, 'Mark your calendars! We''re organizing a team building day on December 20th. Activities include outdoor games, escape room challenges, and a festive dinner. It''s a great opportunity to bond with colleagues and have fun!', 'event_coordinator', NULL, '2025-11-13'),
  (68, 'Virtual Happy Hour This Friday', 17, 'Join us for a virtual happy hour this Friday at 5 PM! It''s a casual event where you can unwind, chat with colleagues, and enjoy some fun games. Link will be shared in the company chat.', 'event_coordinator', NULL, '2025-11-26'),
  (69, 'Employee Journey: From Intern to Team Lead', 18, 'Meet Sarah Johnson, who started as an intern 5 years ago and is now a Team Lead. In this article, she shares her journey, challenges she overcame, and advice for those starting their careers. Her story is truly inspiring!', 'journey_specialist', NULL, '2025-11-13'),
  (70, 'Career Development Program Updates', 18, 'We''ve updated our Career Development Program with new learning paths and mentorship opportunities. Whether you''re looking to advance in your current role or explore new areas, we have resources to support your growth.', 'journey_specialist', NULL, '2025-12-09'),
  (71, 'New Learning Platform Launched', 18, 'We''re excited to introduce our new learning platform with over 500 courses covering technical skills, leadership, and personal development. All employees have free access. Start your learning journey today!', 'journey_specialist', NULL, '2025-11-21'),
  (72, 'Celebrating 10 Years: Employee Milestones', 18, 'This month, we''re celebrating employees who have been with us for 10 years! Their dedication and contributions have been instrumental to our success. Read about their journeys and what keeps them motivated.', 'journey_specialist', NULL, '2025-11-28'),
  (73, 'New Internal Communication Platform', 19, 'We''re rolling out a new internal communication platform to improve collaboration and information sharing. The platform features instant messaging, video calls, file sharing, and project management tools. Training sessions start next week.', 'communication_manager', NULL, '2025-12-03'),
  (74, 'Monthly Newsletter: December Edition', 19, 'Our December newsletter is out! This month''s highlights include Q4 achievements, upcoming events, employee spotlights, and important announcements. Check your inbox or visit the company portal to read the full newsletter.', 'communication_manager', NULL, '2025-11-20'),
  (75, 'Improving Cross-Team Collaboration', 19, 'We''re implementing new processes to enhance cross-team collaboration. This includes regular sync meetings, shared documentation, and collaborative tools. Your feedback is valuable - please share your thoughts in the survey.', 'communication_manager', NULL, '2025-11-22'),
  (76, 'CEO Town Hall - Key Takeaways', 19, 'Missed the CEO Town Hall? Here are the key takeaways: company vision for 2025, new strategic initiatives, Q&A highlights, and upcoming changes. Full recording available on the company portal.', 'communication_manager', NULL, '2025-11-19'),
  (77, 'IT Security Policy Updates', 20, 'Important: We''ve updated our IT security policies to enhance data protection. Key changes include mandatory two-factor authentication, new password requirements, and updated data handling procedures. Please review the policy document.', 'admin_contributor', NULL, '2025-11-19'),
  (78, 'Office Maintenance Schedule', 20, 'Planned maintenance will be conducted in the main office building from December 10-12. Some areas will be temporarily inaccessible. Remote work is encouraged during this period. Detailed schedule available on the portal.', 'admin_contributor', NULL, '2025-11-15'),
  (79, 'New Expense Reporting System', 20, 'We''re transitioning to a new expense reporting system for better efficiency and transparency. The new system offers mobile app support, automated approvals, and real-time tracking. Migration begins January 1st.', 'admin_contributor', NULL, '2025-11-29'),
  (80, 'Updated Remote Work Policy', 20, 'Based on employee feedback, we''ve updated our remote work policy. Employees can now work remotely up to 3 days per week with manager approval. Full policy details and request forms are available on HR portal.', 'admin_contributor', NULL, '2025-11-14'),
  (85, 'bnbnbnb', 17, 'nkjkjkjkknbnnnbn', 'admin', NULL, '2025-12-09');

-- Insert subscribers
INSERT INTO subscribers (id, email, name, subscribed_at) VALUES
  (25, 'alice.martin@example.com', 'Alice Martin', '2025-12-09T22:20:13.074Z'),
  (26, 'bob.wilson@example.com', 'Bob Wilson', '2025-12-09T22:20:13.074Z'),
  (27, 'carol.brown@example.com', 'Carol Brown', '2025-12-09T22:20:13.074Z'),
  (28, 'david.jones@example.com', 'David Jones', '2025-12-09T22:20:13.074Z'),
  (29, 'emma.davis@example.com', 'Emma Davis', '2025-12-09T22:20:13.074Z'),
  (30, 'frank.miller@example.com', 'Frank Miller', '2025-12-09T22:20:13.074Z'),
  (31, 'grace.taylor@example.com', 'Grace Taylor', '2025-12-09T22:20:13.074Z'),
  (32, 'henry.anderson@example.com', 'Henry Anderson', '2025-12-09T22:20:13.074Z');

-- Reset sequences to ensure new inserts continue from the correct point
SELECT setval(pg_get_serial_sequence('domains', 'id'), (SELECT MAX(id) FROM domains));
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('news', 'id'), (SELECT MAX(id) FROM news));
SELECT setval(pg_get_serial_sequence('subscribers', 'id'), (SELECT MAX(id) FROM subscribers));
SELECT setval(pg_get_serial_sequence('audit_log', 'id'), (SELECT MAX(id) FROM audit_log));

-- Notes:
-- 1. All passwords in this file are properly hashed using bcrypt
-- 2. This export contains the complete current state of the database
-- 3. Domain references now use integer IDs instead of names for referential integrity
-- 4. This file should NOT be committed to version control for security reasons