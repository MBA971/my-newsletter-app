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
    const { id } = req.params;
    await pool.query('DELETE FROM subscribers WHERE id = $1', [id]);
    res.json({ message: 'Subscriber deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};