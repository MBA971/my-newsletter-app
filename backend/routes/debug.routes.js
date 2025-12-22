import express from 'express';
import pool from '../utils/database.js';

const router = express.Router();

// Debug endpoint to fix hiring_manager domain assignment
router.post('/fix-hiring-manager', async (req, res) => {
  try {
    console.log('Fixing hiring_manager domain assignment...');
    
    // First, get the Hiring domain ID
    const domainResult = await pool.query("SELECT id FROM domains WHERE name = 'Hiring'");
    
    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hiring domain not found' });
    }
    
    const domainId = domainResult.rows[0].id;
    console.log(`Found Hiring domain with ID: ${domainId}`);
    
    // Update the hiring_manager user to assign the Hiring domain
    const updateResult = await pool.query(
      "UPDATE users SET domain_id = $1 WHERE username = 'hiring_manager' RETURNING *",
      [domainId]
    );
    
    if (updateResult.rows.length > 0) {
      console.log('Successfully updated hiring_manager user domain');
      res.json({ 
        message: 'Successfully updated hiring_manager user domain', 
        user: updateResult.rows[0] 
      });
    } else {
      res.status(404).json({ error: 'hiring_manager user not found' });
    }
  } catch (err) {
    console.error('Error fixing hiring_manager domain:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;