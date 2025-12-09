import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import pool from '../utils/database.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const userResult = await pool.query(
      'SELECT id, username, email, password, role, domain FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Convert domain ID to domain name if domain exists
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
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens with domain name instead of ID
    const userWithDomainName = {
      ...user,
      domain: domainName
    };
    
    const accessToken = generateAccessToken(userWithDomainName);
    const refreshToken = generateRefreshToken(userWithDomainName);
    
    // Log the login action for audit
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await pool.query(
      'INSERT INTO audit_log (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [user.id, 'login', ipAddress, req.headers['user-agent'] || 'Unknown']
    );
    
    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'lax'
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    });
    
    // Send response with user data (excluding password)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      domain: domainName
    };
    
    const response = {
      message: 'Login successful',
      user: userData,
      accessToken: accessToken
    };
    
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    // Log the logout action for audit
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await pool.query(
      'INSERT INTO audit_log (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [req.user.userId, 'logout', ipAddress, req.headers['user-agent'] || 'Unknown']
    );
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const userResult = await pool.query(
      'SELECT id, username, email, role, domain FROM users WHERE id = $1 AND email = $2',
      [decoded.userId, decoded.email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    const user = userResult.rows[0];
    
    // Convert domain ID to domain name if domain exists
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
    
    // Generate new tokens with domain name
    const userWithDomainName = {
      ...user,
      domain: domainName
    };
    
    const newAccessToken = generateAccessToken(userWithDomainName);
    const newRefreshToken = generateRefreshToken(userWithDomainName);
    
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};