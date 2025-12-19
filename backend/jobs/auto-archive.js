import cron from 'node-cron';
import pool from '../utils/database.js';

/**
 * Automatically archive articles older than 30 days
 */
export const startAutoArchiveJob = () => {
    // Run daily at midnight (0 0 * * *)
    cron.schedule('0 0 * * *', async () => {
        console.log('🔄 Auto-archive job started');
        
        try {
            // Archive articles older than 30 days that are not already archived
            const result = await pool.query(
                `UPDATE news 
                 SET archived = true 
                 WHERE date < CURRENT_DATE - INTERVAL '30 days' 
                 AND archived = false 
                 RETURNING id, title`
            );
            
            console.log(`✅ Auto-archive job completed. Archived ${result.rowCount} articles.`);
            
            // Log the archived articles
            if (result.rowCount > 0) {
                console.log('Archived articles:');
                result.rows.forEach(row => {
                    console.log(`  - ID: ${row.id}, Title: ${row.title}`);
                });
            }
        } catch (error) {
            console.error('❌ Auto-archive job failed:', error);
        }
    });
    
    console.log('⏰ Auto-archive job scheduled to run daily at midnight');
};