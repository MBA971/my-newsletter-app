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
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
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
      domain: user.domain
    };
    
    console.log('Sending login response with accessToken:', accessToken);
    console.log('AccessToken type:', typeof accessToken);
    console.log('AccessToken length:', accessToken ? accessToken.length : 'null');
    
    const response = {
      message: 'Login successful',
      user: userData,
      accessToken: accessToken
    };
    
    console.log('Full response object:', response);
    
    // Try to stringify the response to check for serialization issues
    try {
      const responseString = JSON.stringify(response);
      console.log('Response stringified successfully, length:', responseString.length);
    } catch (stringifyError) {
      console.error('Error stringifying response:', stringifyError);
    }
    
    console.log('About to send JSON response');
    res.json(response);
    console.log('JSON response sent successfully');
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
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};