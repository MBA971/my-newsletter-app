import pool from '../utils/database.js';

export const getAllSubscribers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscribers ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createSubscriber = async (req, res) => {
  try {
    const { email, name } = req.body;
    const result = await pool.query(
      'INSERT INTO subscribers (email, name) VALUES ($1, $2) RETURNING *',
      [email, name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteSubscriber = async (req, res) => {
  try {
    // Convert ID to integer
    const id = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid subscriber ID' });
    }
    
    await pool.query('DELETE FROM subscribers WHERE id = $1', [id]);
    res.json({ message: 'Subscriber deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};