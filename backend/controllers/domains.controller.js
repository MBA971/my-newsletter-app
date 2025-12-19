import pool from '../utils/database.js';

export const getAllDomains = async (req, res) => {
  try {
    console.log('[DEBUG] getAllDomains called');
    const result = await pool.query(
      `SELECT d.*, COUNT(n.id) as article_count
       FROM domains d
       LEFT JOIN news n ON d.id = n.domain AND n.pending_validation = false AND n.archived = false
       GROUP BY d.id, d.name, d.color
       ORDER BY d.id`
    );
    
    console.log('[DEBUG] Domain query result:', result.rows);
    
    // Transform the data to ensure correct property names
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      articleCount: parseInt(row.article_count || 0)
    }));
    
    console.log('[DEBUG] Transformed domain data:', transformedRows);
    res.json(transformedRows);
  } catch (err) {
    console.error('[ERROR] getAllDomains:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createDomain = async (req, res) => {
  try {
    // Only super admins can create domains
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create domains' });
    }
    
    const { name, color } = req.body;
    const result = await pool.query(
      'INSERT INTO domains (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateDomain = async (req, res) => {
  try {
    // Convert ID to integer
    const id = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid domain ID' });
    }
    
    // Check if domain admin is trying to update their assigned domain
    if (req.user.role === 'domain_admin') {
      // Get the domain admin's assigned domain
      const userResult = await pool.query(
        'SELECT domain_id FROM users WHERE id = $1',
        [req.user.userId]
      );
      
      if (userResult.rows.length === 0 || userResult.rows[0].domain_id !== id) {
        return res.status(403).json({ error: 'Domain admins can only update their assigned domain' });
      }
    }
    
    const { name, color } = req.body;
    
    // Update the domain
    const result = await pool.query(
      'UPDATE domains SET name = $1, color = $2 WHERE id = $3 RETURNING *',
      [name, color, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteDomain = async (req, res) => {
  try {
    // Convert ID to integer
    const id = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid domain ID' });
    }
    
    // Only super admins can delete domains
    if (req.user.role === 'domain_admin') {
      return res.status(403).json({ error: 'Domain admins cannot delete domains' });
    }
    
    // First delete associated news to avoid foreign key constraint violation
    await pool.query('DELETE FROM news WHERE domain = $1', [id]);
    
    // Then delete the domain
    await pool.query('DELETE FROM domains WHERE id = $1', [id]);
    res.json({ message: 'Domain deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};