import pool from '../utils/database.js';

export const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        audit_log.*, 
        users.username, 
        users.email 
      FROM audit_log 
      JOIN users ON audit_log.user_id = users.id 
      ORDER BY audit_log.timestamp DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};