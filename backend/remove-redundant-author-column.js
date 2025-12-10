import { Pool } from 'pg';

// Create a single database connection pool to be reused
const pool = new Pool({
  user: 'postgres',
  host: 'db', // Use 'db' for Docker
  database: 'newsletter_app',
  password: 'postgres',
  port: 5432,
});

const migrate = async () => {
    try {
        console.log('--- REMOVING REDUNDANT AUTHOR COLUMN ---');
        
        // Check if the author column exists
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'news' AND column_name = 'author'
        `);
        
        if (columnCheck.rows.length > 0) {
            console.log('Removing author column from news table...');
            await pool.query('ALTER TABLE news DROP COLUMN IF EXISTS author');
            console.log('✅ Author column removed successfully');
        } else {
            console.log('⚠️ Author column does not exist, nothing to remove');
        }
        
        console.log('--- MIGRATION COMPLETE ---');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit();
    }
};

migrate();