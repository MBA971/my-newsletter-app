-- Database export script for newsletter_app
-- This script can be used to recreate the database structure and data in production

-- Create database (uncomment if needed)
-- CREATE DATABASE newsletter_app WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';

-- Connect to database (uncomment if needed)
-- \c newsletter_app;

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(50) NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  domain VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  domain VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  editors TEXT[] DEFAULT '{}',
  FOREIGN KEY (domain) REFERENCES domains(name)
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
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert domains
INSERT INTO domains (name, color) VALUES
  ('Hiring', '#3b82f6'),
  ('Event', '#8b5cf6'),
  ('Journey', '#22c55e'),
  ('Communication', '#f97316'),
  ('Admin', '#ef4444');

-- Insert users
-- Note: Passwords are stored as plain text here for demonstration purposes
-- In production, you should hash the passwords using bcrypt
INSERT INTO users (username, email, password, role, domain) VALUES
  ('hiring_manager', 'hiring@company.com', 'hiring123', 'contributor', 'Hiring'),
  ('event_coordinator', 'events@company.com', 'event123', 'contributor', 'Event'),
  ('journey_specialist', 'journey@company.com', 'journey123', 'contributor', 'Journey'),
  ('communication_manager', 'comm@company.com', 'comm123', 'contributor', 'Communication'),
  ('admin_contributor', 'admin.contributor@company.com', 'admin.contrib123', 'contributor', 'Admin'),
  ('admin', 'admin@company.com', 'admin123', 'admin', NULL),
  ('john_doe', 'john.doe@company.com', 'user123', 'user', NULL),
  ('jane_smith', 'jane.smith@company.com', 'user123', 'user', NULL);

-- Insert subscribers
INSERT INTO subscribers (email, name) VALUES
  ('alice.martin@example.com', 'Alice Martin'),
  ('bob.wilson@example.com', 'Bob Wilson'),
  ('carol.brown@example.com', 'Carol Brown'),
  ('david.jones@example.com', 'David Jones'),
  ('emma.davis@example.com', 'Emma Davis'),
  ('frank.miller@example.com', 'Frank Miller'),
  ('grace.taylor@example.com', 'Grace Taylor'),
  ('henry.anderson@example.com', 'Henry Anderson');

-- Insert news articles
INSERT INTO news (title, domain, content, author, date) VALUES
  -- Hiring domain articles
  ('We''re Hiring: Senior Software Engineers', 'Hiring', 'We are looking for talented Senior Software Engineers to join our growing team. We offer competitive salaries, flexible working hours, and the opportunity to work on cutting-edge projects. If you''re passionate about technology and innovation, we want to hear from you!', 'hiring_manager', CURRENT_DATE - 5),
  ('New Internship Program Launched', 'Hiring', 'We''re excited to announce our new internship program for students and recent graduates. This 6-month program offers hands-on experience, mentorship from industry experts, and potential full-time opportunities. Applications are now open!', 'hiring_manager', CURRENT_DATE - 10),
  ('Join Our Product Design Team', 'Hiring', 'We''re expanding our product design team and looking for creative minds who can help shape the future of our products. Experience with Figma, user research, and prototyping is a plus. Remote work options available.', 'hiring_manager', CURRENT_DATE - 15),
  ('Data Scientist Position Open', 'Hiring', 'Are you passionate about data and analytics? We''re seeking a Data Scientist to help us make data-driven decisions. You''ll work with large datasets, build predictive models, and collaborate with cross-functional teams.', 'hiring_manager', CURRENT_DATE - 20),

  -- Event domain articles
  ('Annual Company Conference 2025', 'Event', 'Save the date! Our annual company conference will be held on March 15-17, 2025. This year''s theme is "Innovation and Growth". Join us for keynote speeches, workshops, networking sessions, and team-building activities. Registration opens next week!', 'event_coordinator', CURRENT_DATE - 3),
  ('Tech Talk Series: AI and Machine Learning', 'Event', 'Join us for our monthly Tech Talk series! This month, we''re diving into AI and Machine Learning. Our guest speaker, Dr. Sarah Chen, will discuss the latest trends and practical applications. Thursday, 2 PM in the main auditorium.', 'event_coordinator', CURRENT_DATE - 8),
  ('Team Building Day - December 20th', 'Event', 'Mark your calendars! We''re organizing a team building day on December 20th. Activities include outdoor games, escape room challenges, and a festive dinner. It''s a great opportunity to bond with colleagues and have fun!', 'event_coordinator', CURRENT_DATE - 12),
  ('Virtual Happy Hour This Friday', 'Event', 'Join us for a virtual happy hour this Friday at 5 PM! It''s a casual event where you can unwind, chat with colleagues, and enjoy some fun games. Link will be shared in the company chat.', 'event_coordinator', CURRENT_DATE - 18),

  -- Journey domain articles
  ('Employee Journey: From Intern to Team Lead', 'Journey', 'Meet Sarah Johnson, who started as an intern 5 years ago and is now a Team Lead. In this article, she shares her journey, challenges she overcame, and advice for those starting their careers. Her story is truly inspiring!', 'journey_specialist', CURRENT_DATE - 2),
  ('Career Development Program Updates', 'Journey', 'We''ve updated our Career Development Program with new learning paths and mentorship opportunities. Whether you''re looking to advance in your current role or explore new areas, we have resources to support your growth.', 'journey_specialist', CURRENT_DATE - 7),
  ('New Learning Platform Launched', 'Journey', 'We''re excited to introduce our new learning platform with over 500 courses covering technical skills, leadership, and personal development. All employees have free access. Start your learning journey today!', 'journey_specialist', CURRENT_DATE - 14),
  ('Celebrating 10 Years: Employee Milestones', 'Journey', 'This month, we''re celebrating employees who have been with us for 10 years! Their dedication and contributions have been instrumental to our success. Read about their journeys and what keeps them motivated.', 'journey_specialist', CURRENT_DATE - 22),

  -- Communication domain articles
  ('New Internal Communication Platform', 'Communication', 'We''re rolling out a new internal communication platform to improve collaboration and information sharing. The platform features instant messaging, video calls, file sharing, and project management tools. Training sessions start next week.', 'communication_manager', CURRENT_DATE - 1),
  ('Monthly Newsletter: December Edition', 'Communication', 'Our December newsletter is out! This month''s highlights include Q4 achievements, upcoming events, employee spotlights, and important announcements. Check your inbox or visit the company portal to read the full newsletter.', 'communication_manager', CURRENT_DATE - 6),
  ('Improving Cross-Team Collaboration', 'Communication', 'We''re implementing new processes to enhance cross-team collaboration. This includes regular sync meetings, shared documentation, and collaborative tools. Your feedback is valuable - please share your thoughts in the survey.', 'communication_manager', CURRENT_DATE - 11),
  ('CEO Town Hall - Key Takeaways', 'Communication', 'Missed the CEO Town Hall? Here are the key takeaways: company vision for 2025, new strategic initiatives, Q&A highlights, and upcoming changes. Full recording available on the company portal.', 'communication_manager', CURRENT_DATE - 16),

  -- Admin domain articles
  ('IT Security Policy Updates', 'Admin', 'Important: We''ve updated our IT security policies to enhance data protection. Key changes include mandatory two-factor authentication, new password requirements, and updated data handling procedures. Please review the policy document.', 'admin_contributor', CURRENT_DATE - 4),
  ('Office Maintenance Schedule', 'Admin', 'Planned maintenance will be conducted in the main office building from December 10-12. Some areas will be temporarily inaccessible. Remote work is encouraged during this period. Detailed schedule available on the portal.', 'admin_contributor', CURRENT_DATE - 9),
  ('New Expense Reporting System', 'Admin', 'We''re transitioning to a new expense reporting system for better efficiency and transparency. The new system offers mobile app support, automated approvals, and real-time tracking. Migration begins January 1st.', 'admin_contributor', CURRENT_DATE - 13),
  ('Updated Remote Work Policy', 'Admin', 'Based on employee feedback, we''ve updated our remote work policy. Employees can now work remotely up to 3 days per week with manager approval. Full policy details and request forms are available on HR portal.', 'admin_contributor', CURRENT_DATE - 19);

-- Reset sequences to ensure new inserts continue from the correct point
SELECT setval(pg_get_serial_sequence('domains', 'id'), (SELECT MAX(id) FROM domains));
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('news', 'id'), (SELECT MAX(id) FROM news));
SELECT setval(pg_get_serial_sequence('subscribers', 'id'), (SELECT MAX(id) FROM subscribers));
SELECT setval(pg_get_serial_sequence('audit_log', 'id'), (SELECT MAX(id) FROM audit_log));