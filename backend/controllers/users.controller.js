import bcrypt from 'bcrypt';
import config from '../config/config.js';
import pool from '../utils/database.js';

export const getAllUsers = async (req, res) => {
  try {
    console.log('[DEBUG] getAllUsers called');
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at, d.name as domain_name, u.domain_id
       FROM users u
       LEFT JOIN domains d ON u.domain_id = d.id
       ORDER BY u.id`
    );
    
    console.log('[DEBUG] Users query result:', JSON.stringify(result.rows, null, 2));
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => {
      console.log('[DEBUG] Processing row:', JSON.stringify(row, null, 2));
      const domainValue = row.domain_name || 'No Domain Assigned';
      console.log('[DEBUG] Domain value:', domainValue);
      const transformedRow = {
        id: row.id,
        username: row.username,
        email: row.email,
        role: row.role,
        created_at: row.created_at,
        domain: domainValue
      };
      console.log('[DEBUG] Transformed row:', JSON.stringify(transformedRow, null, 2));
      return transformedRow;
    });
    
    console.log('[DEBUG] Final transformed users data:', JSON.stringify(transformedRows, null, 2));
    console.log('[DEBUG] Sending transformed users response');
    res.json(transformedRows);
  } catch (err) {
    console.error('[ERROR] getAllUsers:', err);
    res.status(500).json({ error: 'Server error' });
  }
};export const getUsersByDomain = async (req, res) => {
  try {
    console.log('[DEBUG] getUsersByDomain called with user:', req.user);
    // Get the domain admin's assigned domain
    const userResult = await pool.query(
      'SELECT domain_id FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    console.log('[DEBUG] User domain query result:', userResult.rows);
    
    if (userResult.rows.length === 0 || !userResult.rows[0].domain_id) {
      return res.status(400).json({ error: 'Domain admin not assigned to a domain' });
    }
    
    const domainId = userResult.rows[0].domain_id;
    
    // Get users in this domain (contributors and domain admins only)
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at, d.name as domain_name, u.domain_id
       FROM users u
       LEFT JOIN domains d ON u.domain_id = d.id
       WHERE u.domain_id = $1 AND (u.role = 'contributor' OR u.role = 'domain_admin')
       ORDER BY u.id`,
      [domainId]
    );
    
    console.log('[DEBUG] Domain users query result:', JSON.stringify(result.rows, null, 2));
    
    // Transform the data to match the old format (domain as name instead of ID)
    const transformedRows = result.rows.map(row => {
      console.log('[DEBUG] Processing domain user row:', JSON.stringify(row, null, 2));
      const domainValue = row.domain_name || 'No Domain Assigned';
      console.log('[DEBUG] Domain value for user:', domainValue);
      const transformedRow = {
        id: row.id,
        username: row.username,
        email: row.email,
        role: row.role,
        created_at: row.created_at,
        domain: domainValue
      };
      console.log('[DEBUG] Transformed domain user row:', JSON.stringify(transformedRow, null, 2));
      return transformedRow;
    });
    
    console.log('[DEBUG] Final transformed domain users data:', JSON.stringify(transformedRows, null, 2));
    console.log('[DEBUG] Sending transformed domain users response');
    res.json(transformedRows);  } catch (err) {
    console.error('[ERROR] getUsersByDomain:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role, domain } = req.body;

    // Hash password
    const saltRounds = config.jwt.rounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Handle domain - now it should be an integer ID
    let domainId = null;
    if (domain !== undefined && domain !== null && domain !== '') {
      // Convert domain to integer if it's a string
      if (typeof domain === 'string') {
        domainId = parseInt(domain);
      } else if (typeof domain === 'number') {
        domainId = domain;
      }
      
      // Validate that domainId is a valid integer
      if (isNaN(domainId)) {
        return res.status(400).json({ error: 'Invalid domain ID' });
      }
    }

    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, domain_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, hashedPassword, role, domainId]
    );

    // Remove password from response and add domain name
    const user = result.rows[0];
    let domainName = null;
    if (user.domain_id) {
      const domainResult = await pool.query(
        'SELECT name FROM domains WHERE id = $1',
        [user.domain_id]
      );
      if (domainResult.rows.length > 0) {
        domainName = domainResult.rows[0].name;
      }
    }

    const { password: _, domain_id: __, ...userWithoutPassword } = user;
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
    if (req.user.role !== 'super_admin' && !isSelf) {
      return res.status(403).json({ error: 'Unauthorized to update this user' });
    }

    let { username, email, role, domain, password } = req.body;

    // Prevent privilege escalation: Non-super_admins cannot change role or domain
    if (req.user.role !== 'super_admin') {
      role = req.user.role;
      // Keep the existing domain for non-super_admins
      // domain will remain as provided in the request body
    }

    // Handle domain - now it should be an integer ID
    let domainId = null;
    if (domain !== undefined && domain !== null && domain !== '') {
      // Convert domain to integer if it's a string
      if (typeof domain === 'string') {
        domainId = parseInt(domain);
      } else if (typeof domain === 'number') {
        domainId = domain;
      }
      
      // Validate that domainId is a valid integer
      if (isNaN(domainId)) {
        return res.status(400).json({ error: 'Invalid domain ID' });
      }
    }

    let query = 'UPDATE users SET username = $1, email = $2, role = $3, domain_id = $4';
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
    if (user.domain_id) {
      const domainResult = await pool.query(
        'SELECT name FROM domains WHERE id = $1',
        [user.domain_id]
      );
      if (domainResult.rows.length > 0) {
        domainName = domainResult.rows[0].name;
      }
    }

    const { password: _, domain_id: __, ...userWithoutPassword } = user;
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