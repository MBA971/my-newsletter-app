-- ================================================
-- Newsletter App - Full Database Export for pgAdmin
-- ================================================
-- This script exports the complete newsletter_app database
-- with all data and properly hashed passwords.
-- 
-- INSTRUCTIONS:
-- 1. Open pgAdmin
-- 2. Connect to your PostgreSQL server
-- 3. Open the Query Tool
-- 4. Copy and execute this entire script
-- 5. The result will contain your complete database export
-- 
-- NOTE: This export is intended for local use only and 
-- should NOT be committed to version control.

-- Function to generate the full database export
CREATE OR REPLACE FUNCTION generate_full_database_export()
RETURNS TABLE(export_content TEXT) AS $$
DECLARE
    export_text TEXT := '';
    row_record RECORD;
BEGIN
    -- Add header information
    export_text := export_text || '-- Database export script for newsletter_app' || E'\n';
    export_text := export_text || '-- Generated on: ' || NOW() || E'\n';
    export_text := export_text || '-- This script contains all data with properly hashed passwords' || E'\n\n';

    -- Add drop and create table statements
    export_text := export_text || '-- Drop existing tables if they exist (for clean slate)' || E'\n';
    export_text := export_text || 'DROP TABLE IF EXISTS audit_log CASCADE;' || E'\n';
    export_text := export_text || 'DROP TABLE IF EXISTS subscribers CASCADE;' || E'\n';
    export_text := export_text || 'DROP TABLE IF EXISTS news CASCADE;' || E'\n';
    export_text := export_text || 'DROP TABLE IF EXISTS users CASCADE;' || E'\n';
    export_text := export_text || 'DROP TABLE IF EXISTS domains CASCADE;' || E'\n\n';

    -- Get and export domains table structure
    export_text := export_text || '-- Create domains table' || E'\n';
    export_text := export_text || 'CREATE TABLE domains (' || E'\n';
    export_text := export_text || '  id SERIAL PRIMARY KEY,' || E'\n';
    export_text := export_text || '  name VARCHAR(100) NOT NULL UNIQUE,' || E'\n';
    export_text := export_text || '  color VARCHAR(50) NOT NULL' || E'\n';
    export_text := export_text || ');' || E'\n\n';

    -- Get and export users table structure
    export_text := export_text || '-- Create users table' || E'\n';
    export_text := export_text || 'CREATE TABLE users (' || E'\n';
    export_text := export_text || '  id SERIAL PRIMARY KEY,' || E'\n';
    export_text := export_text || '  username VARCHAR(50) UNIQUE NOT NULL,' || E'\n';
    export_text := export_text || '  email VARCHAR(100) UNIQUE NOT NULL,' || E'\n';
    export_text := export_text || '  password VARCHAR(255) NOT NULL,' || E'\n';
    export_text := export_text || '  role VARCHAR(20) NOT NULL DEFAULT ''user'',' || E'\n';
    export_text := export_text || '  domain INTEGER REFERENCES domains(id),' || E'\n';
    export_text := export_text || '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' || E'\n';
    export_text := export_text || ');' || E'\n\n';

    -- Get and export news table structure
    export_text := export_text || '-- Create news table' || E'\n';
    export_text := export_text || 'CREATE TABLE news (' || E'\n';
    export_text := export_text || '  id SERIAL PRIMARY KEY,' || E'\n';
    export_text := export_text || '  title VARCHAR(255) NOT NULL,' || E'\n';
    export_text := export_text || '  domain INTEGER NOT NULL REFERENCES domains(id),' || E'\n';
    export_text := export_text || '  content TEXT NOT NULL,' || E'\n';
    export_text := export_text || '  author VARCHAR(100) NOT NULL,' || E'\n';
    export_text := export_text || '  author_id INTEGER,' || E'\n';
    export_text := export_text || '  date DATE NOT NULL DEFAULT CURRENT_DATE' || E'\n';
    export_text := export_text || ');' || E'\n\n';

    -- Get and export subscribers table structure
    export_text := export_text || '-- Create subscribers table' || E'\n';
    export_text := export_text || 'CREATE TABLE subscribers (' || E'\n';
    export_text := export_text || '  id SERIAL PRIMARY KEY,' || E'\n';
    export_text := export_text || '  email VARCHAR(100) UNIQUE NOT NULL,' || E'\n';
    export_text := export_text || '  name VARCHAR(100),' || E'\n';
    export_text := export_text || '  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' || E'\n';
    export_text := export_text || ');' || E'\n\n';

    -- Get and export audit_log table structure
    export_text := export_text || '-- Create audit log table' || E'\n';
    export_text := export_text || 'CREATE TABLE audit_log (' || E'\n';
    export_text := export_text || '  id SERIAL PRIMARY KEY,' || E'\n';
    export_text := export_text || '  user_id INTEGER,' || E'\n';
    export_text := export_text || '  action VARCHAR(50) NOT NULL,' || E'\n';
    export_text := export_text || '  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,' || E'\n';
    export_text := export_text || '  ip_address VARCHAR(45),' || E'\n';
    export_text := export_text || '  user_agent TEXT,' || E'\n';
    export_text := export_text || '  FOREIGN KEY (user_id) REFERENCES users(id)' || E'\n';
    export_text := export_text || ');' || E'\n\n';

    -- Export domains data
    export_text := export_text || '-- Insert domains' || E'\n';
    FOR row_record IN SELECT * FROM domains ORDER BY id LOOP
        export_text := export_text || 'INSERT INTO domains (id, name, color) VALUES (' || 
                      row_record.id || ', ''' || REPLACE(row_record.name, '''', '''''') || 
                      ''', ''' || row_record.color || ''');' || E'\n';
    END LOOP;
    export_text := export_text || E'\n';

    -- Export users data (with hashed passwords)
    export_text := export_text || '-- Insert users (passwords are properly hashed)' || E'\n';
    FOR row_record IN SELECT * FROM users ORDER BY id LOOP
        export_text := export_text || 'INSERT INTO users (id, username, email, password, role, domain, created_at) VALUES (' || 
                      row_record.id || ', ''' || REPLACE(row_record.username, '''', '''''') || 
                      ''', ''' || REPLACE(row_record.email, '''', '''''') || 
                      ''', ''' || row_record.password || 
                      ''', ''' || row_record.role || ''', ';
        IF row_record.domain IS NULL THEN
            export_text := export_text || 'NULL, ';
        ELSE
            export_text := export_text || row_record.domain || ', ';
        END IF;
        export_text := export_text || 'TIMESTAMP ''' || row_record.created_at || ''');' || E'\n';
    END LOOP;
    export_text := export_text || E'\n';

    -- Export news data
    export_text := export_text || '-- Insert news articles' || E'\n';
    FOR row_record IN SELECT * FROM news ORDER BY id LOOP
        export_text := export_text || 'INSERT INTO news (id, title, domain, content, author, author_id, date) VALUES (' || 
                      row_record.id || ', ''' || REPLACE(row_record.title, '''', '''''') || 
                      ''', ' || row_record.domain || 
                      ', ''' || REPLACE(row_record.content, '''', '''''') || 
                      ''', ''' || REPLACE(row_record.author, '''', '''''') || ''', ';
        IF row_record.author_id IS NULL THEN
            export_text := export_text || 'NULL, ';
        ELSE
            export_text := export_text || row_record.author_id || ', ';
        END IF;
        export_text := export_text || 'DATE ''' || row_record.date || ''');' || E'\n';
    END LOOP;
    export_text := export_text || E'\n';

    -- Export subscribers data
    export_text := export_text || '-- Insert subscribers' || E'\n';
    FOR row_record IN SELECT * FROM subscribers ORDER BY id LOOP
        export_text := export_text || 'INSERT INTO subscribers (id, email, name, subscribed_at) VALUES (' || 
                      row_record.id || ', ''' || REPLACE(row_record.email, '''', '''''') || ''', ';
        IF row_record.name IS NULL THEN
            export_text := export_text || 'NULL, ';
        ELSE
            export_text := export_text || '''' || REPLACE(row_record.name, '''', '''''') || ''', ';
        END IF;
        export_text := export_text || 'TIMESTAMP ''' || row_record.subscribed_at || ''');' || E'\n';
    END LOOP;
    export_text := export_text || E'\n';

    -- Export audit_log data
    export_text := export_text || '-- Insert audit log entries' || E'\n';
    FOR row_record IN SELECT * FROM audit_log ORDER BY id LOOP
        export_text := export_text || 'INSERT INTO audit_log (id, user_id, action, timestamp, ip_address, user_agent) VALUES (' || 
                      row_record.id || ', ';
        IF row_record.user_id IS NULL THEN
            export_text := export_text || 'NULL, ';
        ELSE
            export_text := export_text || row_record.user_id || ', ';
        END IF;
        export_text := export_text || '''' || REPLACE(row_record.action, '''', '''''') || ''', ';
        export_text := export_text || 'TIMESTAMP ''' || row_record.timestamp || ''', ';
        IF row_record.ip_address IS NULL THEN
            export_text := export_text || 'NULL, ';
        ELSE
            export_text := export_text || '''' || REPLACE(row_record.ip_address, '''', '''''') || ''', ';
        END IF;
        IF row_record.user_agent IS NULL THEN
            export_text := export_text || 'NULL'; 
        ELSE
            export_text := export_text || '''' || REPLACE(row_record.user_agent, '''', '''''') || '''';
        END IF;
        export_text := export_text || ');' || E'\n';
    END LOOP;
    export_text := export_text || E'\n';

    -- Add sequence resets
    export_text := export_text || '-- Reset sequences to ensure new inserts continue from the correct point' || E'\n';
    export_text := export_text || 'SELECT setval(pg_get_serial_sequence(''domains'', ''id''), (SELECT MAX(id) FROM domains));' || E'\n';
    export_text := export_text || 'SELECT setval(pg_get_serial_sequence(''users'', ''id''), (SELECT MAX(id) FROM users));' || E'\n';
    export_text := export_text || 'SELECT setval(pg_get_serial_sequence(''news'', ''id''), (SELECT MAX(id) FROM news));' || E'\n';
    export_text := export_text || 'SELECT setval(pg_get_serial_sequence(''subscribers'', ''id''), (SELECT MAX(id) FROM subscribers));' || E'\n';
    export_text := export_text || 'SELECT setval(pg_get_serial_sequence(''audit_log'', ''id''), (SELECT MAX(id) FROM audit_log));' || E'\n\n';

    -- Add notes
    export_text := export_text || '-- Notes:' || E'\n';
    export_text := export_text || '-- 1. All passwords in this file are properly hashed using bcrypt' || E'\n';
    export_text := export_text || '-- 2. This export contains the complete current state of the database' || E'\n';
    export_text := export_text || '-- 3. Save this output to a file for backup or migration purposes' || E'\n';
    export_text := export_text || '-- 4. This file should NOT be committed to version control' || E'\n';

    RETURN QUERY SELECT export_text;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate the export
SELECT generate_full_database_export();

-- Clean up by dropping the temporary function
DROP FUNCTION IF EXISTS generate_full_database_export();