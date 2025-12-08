import pool from '../utils/database.js';

export const getAllDomains = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM domains ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createDomain = async (req, res) => {
  try {
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
    const { id } = req.params;
    const { name, color } = req.body;
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
    const { id } = req.params;
    await pool.query('DELETE FROM domains WHERE id = $1', [id]);
    // Also delete associated news
    await pool.query('DELETE FROM news WHERE domain = (SELECT name FROM domains WHERE id = $1)', [id]);
    res.json({ message: 'Domain deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};