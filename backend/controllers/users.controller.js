import bcrypt from 'bcrypt';
import config from '../config/config.js';
import pool from '../utils/database.js';

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, domain, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role, domain } = req.body;

    // Hash password
    const saltRounds = config.jwt.rounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, domain) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, hashedPassword, role, domain]
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result.rows[0];
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions: Admin or Self
    // req.user.userId comes from authenticatedToken middleware
    const isSelf = parseInt(id) === parseInt(req.user.userId);
    if (req.user.role !== 'admin' && !isSelf) {
      return res.status(403).json({ error: 'Unauthorized to update this user' });
    }

    let { username, email, role, domain, password } = req.body;

    // Prevent privilege escalation: Non-admins cannot change role or domain
    if (req.user.role !== 'admin') {
      role = req.user.role;
      domain = req.user.domain;
    }

    let query = 'UPDATE users SET username = $1, email = $2, role = $3, domain = $4';
    let params = [username, email, role, domain];

    if (password && password.trim() !== '') {
      const saltRounds = config.jwt.rounds;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      query += ', password = $5';
      params.push(hashedPassword);
    }

    query += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result.rows[0];
    res.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};