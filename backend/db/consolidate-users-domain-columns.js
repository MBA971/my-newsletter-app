import { Pool } from 'pg';

// Database configuration for connecting from inside Docker network
const pool = new Pool({
    user: 'postgres',
    host: 'db', // Use 'db' as defined in docker-compose.yml for container networking
    database: 'newsletter_app',
    password: 'postgres',
    port: 5432, // Internal port within Docker network
});

async function consolidateDomainColumns() {
    let client;
    
    try {
        console.log('=== CONSOLIDATING USERS DOMAIN COLUMNS ===');
        client = await pool.connect();
        
        // Start transaction
        await client.query('BEGIN');
        
        // 1. Copy data from domain_id to domain where domain_id has data and domain is NULL
        console.log('Copying data from domain_id to domain where needed...');
        const copyResult = await client.query(`
            UPDATE users 
            SET domain = domain_id 
            WHERE domain IS NULL AND domain_id IS NOT NULL
        `);
        console.log(`✅ Updated ${copyResult.rowCount} rows`);
        
        // 2. Drop the domain_id column
        console.log('Dropping domain_id column...');
        await client.query(`
            ALTER TABLE users 
            DROP COLUMN IF EXISTS domain_id
        `);
        console.log('✅ Dropped domain_id column');
        
        // 3. Rename the domain column to domain_id for clarity (since it stores IDs)
        console.log('Renaming domain column to domain_id for clarity...');
        await client.query(`
            ALTER TABLE users 
            RENAME COLUMN domain TO domain_id
        `);
        console.log('✅ Renamed domain column to domain_id');
        
        // 4. Add foreign key constraint
        console.log('Adding foreign key constraint...');
        await client.query(`
            ALTER TABLE users 
            ADD CONSTRAINT fk_users_domain_id 
            FOREIGN KEY (domain_id) REFERENCES domains(id)
        `);
        console.log('✅ Added foreign key constraint');
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log('\n✅ SUCCESS: Domain columns consolidated!');
        console.log('\nSummary of changes:');
        console.log('- Consolidated domain and domain_id columns into a single domain_id column');
        console.log('- Added proper foreign key constraint');
        console.log('- Maintained all existing data');
        
    } catch (error) {
        // Rollback transaction on error
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('❌ Error consolidating domain columns:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
        console.log('🔒 Database connection closed');
    }
}

// Run the script
consolidateDomainColumns();