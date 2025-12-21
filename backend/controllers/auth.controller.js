import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import pool from '../utils/database.js';
import { asyncHandler } from '../utils/errorHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const userResult = await pool.query(
    'SELECT id, username, email, password, role, domain_id FROM users WHERE email = $1',
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

  // Convert domain ID to domain name if domain exists
  let domainName = null;
  let domainId = user.domain_id;

  if (domainId) {
    const domainResult = await pool.query(
      'SELECT name FROM domains WHERE id = $1',
      [domainId]
    );
    if (domainResult.rows.length > 0) {
      domainName = domainResult.rows[0].name;
    }
  }

  // Generate tokens with both domain name and ID
  const userWithDomainInfo = {
    ...user,
    domain: domainName,      // Domain name for UI display
    domain_id: domainId      // Domain ID for backend operations
  };

  const accessToken = generateAccessToken(userWithDomainInfo);
  const refreshToken = generateRefreshToken(userWithDomainInfo);

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

  // Send response with user data (including domain_id for clarity)
  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    domain_id: user.domain_id
  };

  const response = {
    message: 'Login successful',
    user: userData,
    accessToken: accessToken
  };

  res.json(response);
});

export const logout = asyncHandler(async (req, res) => {
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
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Find user
  const userResult = await pool.query(
    'SELECT id, username, email, role, domain_id FROM users WHERE id = $1 AND email = $2',
    [decoded.userId, decoded.email]
  );

  if (userResult.rows.length === 0) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }

  const user = userResult.rows[0];

  // Convert domain ID to domain name if domain exists
  let domainName = null;
  let domainId = user.domain_id;

  if (domainId) {
    const domainResult = await pool.query(
      'SELECT name FROM domains WHERE id = $1',
      [domainId]
    );
    if (domainResult.rows.length > 0) {
      domainName = domainResult.rows[0].name;
    }
  }

  // Generate new tokens with both domain name and ID
  const userWithDomainInfo = {
    ...user,
    domain: domainName,      // Domain name for UI display
    domain_id: domainId      // Domain ID for backend operations
  };

  const newAccessToken = generateAccessToken(userWithDomainInfo);
  const newRefreshToken = generateRefreshToken(userWithDomainInfo);

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  });
});