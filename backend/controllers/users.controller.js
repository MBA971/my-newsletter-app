import bcrypt from 'bcrypt';
import config from '../config/config.js';
import pool from '../utils/database.js';

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at, d.name as domain_name
       FROM users u
       LEFT JOIN domains d ON u.domain = d.id
       ORDER BY u.id`
    );
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => ({
      ...row,
      domain: row.domain_name
    })).map(({ domain_name, ...rest }) => rest);
    
    res.json(transformedRows);
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

    // Get domain ID from domain name
    let domainId = null;
    if (domain) {
      const domainResult = await pool.query(
        'SELECT id FROM domains WHERE name = $1',
        [domain]
      );
      if (domainResult.rows.length > 0) {
        domainId = domainResult.rows[0].id;
      }
    }

    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, domain) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, hashedPassword, role, domainId]
    );

    // Remove password from response and add domain name
    const user = result.rows[0];
    let domainName = null;
    if (user.domain) {
      const domainResult = await pool.query(
        'SELECT name FROM domains WHERE id = $1',
        [user.domain]
      );
      if (domainResult.rows.length > 0) {
        domainName = domainResult.rows[0].name;
      }
    }

    const { password: _, domain: __, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, domain: domainName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    // Convert ID to integer
    const id = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check permissions: Admin or Self
    // req.user.userId comes from authenticatedToken middleware
    const isSelf = id === parseInt(req.user.userId);
    if (req.user.role !== 'admin' && !isSelf) {
      return res.status(403).json({ error: 'Unauthorized to update this user' });
    }

    let { username, email, role, domain, password } = req.body;

    // Prevent privilege escalation: Non-admins cannot change role or domain
    if (req.user.role !== 'admin') {
      role = req.user.role;
      domain = req.user.domain;
    }

    // Get domain ID from domain name
    let domainId = null;
    if (domain) {
      const domainResult = await pool.query(
        'SELECT id FROM domains WHERE name = $1',
        [domain]
      );
      if (domainResult.rows.length > 0) {
        domainId = domainResult.rows[0].id;
      }
    }

    let query = 'UPDATE users SET username = $1, email = $2, role = $3, domain = $4';
    let params = [username, email, role, domainId];

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

    // Remove password from response and add domain name
    const user = result.rows[0];
    let domainName = null;
    if (user.domain) {
      const domainResult = await pool.query(
        'SELECT name FROM domains WHERE id = $1',
        [user.domain]
      );
      if (domainResult.rows.length > 0) {
        domainName = domainResult.rows[0].name;
      }
    }

    const { password: _, domain: __, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, domain: domainName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Convert ID to integer
    const id = parseInt(req.params.id);
    
    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // First delete associated audit logs to avoid foreign key constraint violation
    await pool.query('DELETE FROM audit_log WHERE user_id = $1', [id]);
    
    // Then delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};