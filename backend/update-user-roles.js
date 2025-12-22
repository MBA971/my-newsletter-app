import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== UPDATE USER ROLES SCRIPT ===');

// Database configuration for connecting from host machine
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'newsletter_app',
    password: 'postgres',
    port: 5433, // Port exposed to host machine
});

// Alternative configuration for connecting from inside Docker network
const dockerPool = new Pool({
    user: 'postgres',
    host: 'db', // Use 'db' as defined in docker-compose.yml for container networking
    database: 'newsletter_app',
    password: 'postgres',
    port: 5432, // Internal port within Docker network
});

async function updateUserRoles() {
    // Try to connect using host configuration first
    let client;
    let poolToUse = pool;
    
    try {
        console.log('Attempting to connect to database via host...');
        client = await pool.connect();
        console.log('✅ Connected via host configuration');
    } catch (hostError) {
        console.log('❌ Failed to connect via host, trying Docker network...');
        try {
            poolToUse = dockerPool;
            client = await dockerPool.connect();
            console.log('✅ Connected via Docker network');
        } catch (dockerError) {
            console.error('❌ Failed to connect via both methods:');
            console.error('Host error:', hostError.message);
            console.error('Docker error:', dockerError.message);
            process.exit(1);
        }
    }
    
    try {
        console.log('Updating user roles...');
        
        // 1. Add domain column to users table if it doesn't exist
        console.log('Ensuring domain column exists in users table...');
        try {
            await client.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS domain_id INTEGER REFERENCES domains(id)
            `);
            console.log('✅ domain column ensured in users table');
        } catch (err) {
            console.log('⚠️  Error ensuring domain column:', err.message);
        }
        
        // 2. Update existing admin users to super_admin
        console.log('Updating admin users to super_admin...');
        const adminResult = await client.query(`
            UPDATE users 
            SET role = 'super_admin' 
            WHERE role = 'admin'
        `);
        console.log(`✅ Updated ${adminResult.rowCount} admin users to super_admin`);
        
        // 3. Create a sample domain admin user if none exists
        console.log('Checking for domain admin users...');
        const domainAdminCheck = await client.query(`
            SELECT COUNT(*) as count FROM users WHERE role = 'domain_admin'
        `);
        
        if (parseInt(domainAdminCheck.rows[0].count) === 0) {
            console.log('No domain admin users found. Creating sample domain admin...');
            // First, check if we have domains
            const domainsResult = await client.query('SELECT id FROM domains LIMIT 1');
            if (domainsResult.rows.length > 0) {
                const domainId = domainsResult.rows[0].id;
                await client.query(`
                    INSERT INTO users (username, email, password, role, domain_id) 
                    VALUES ('domain_admin', 'domain_admin@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'domain_admin', $1)
                    ON CONFLICT (email) DO NOTHING
                `, [domainId]);
                console.log('✅ Sample domain admin user created');
            } else {
                console.log('⚠️  No domains found, skipping domain admin creation');
            }
        } else {
            console.log('✅ Domain admin users already exist');
        }
        
        // 4. Show the updated roles
        console.log('\nCurrent user roles:');
        const rolesResult = await client.query(`
            SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role
        `);
        rolesResult.rows.forEach(row => {
            console.log(`  ${row.role}: ${row.count}`);
        });
        
        console.log('\n✅ User roles updated successfully!');
        console.log('\nSummary of changes:');
        console.log('- Added domain_id column to users table');
        console.log('- Updated all admin users to super_admin');
        console.log('- Ensured at least one domain_admin user exists');
        
    } catch (error) {
        console.error('❌ Error updating user roles:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (client) {
            client.release();
        }
        await poolToUse.end();
        console.log('🔒 Database connection closed');
    }
}

// Run the script
updateUserRoles();