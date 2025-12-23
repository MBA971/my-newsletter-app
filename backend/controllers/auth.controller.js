import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import pool from '../utils/database.js';
import { asyncHandler } from '../utils/errorHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔍 LOGIN ATTEMPT:', { email, timestamp: new Date().toISOString(), ip: req.ip });

  // Find user
  const userResult = await pool.query(
    'SELECT id, username, email, password, role, domain_id FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    console.log('❌ LOGIN FAILED: User not found for email:', email);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = userResult.rows[0];
  console.log('✅ User found, verifying password for user:', user.id);

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    console.log('❌ LOGIN FAILED: Invalid password for user:', user.id);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  console.log('✅ Password verified successfully for user:', user.id);

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
  
  console.log('✅ Domain lookup completed for user:', { userId: user.id, domainId, domainName });

  // Generate tokens with both domain name and ID
  const userWithDomainInfo = {
    ...user,
    domain: domainName,      // Domain name for UI display
    domain_id: domainId      // Domain ID for backend operations
  };

  const accessToken = generateAccessToken(userWithDomainInfo);
  const refreshToken = generateRefreshToken(userWithDomainInfo);
  
  console.log('✅ JWT tokens generated for user:', user.id);

  // Log the login action for audit
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  await pool.query(
    'INSERT INTO audit_log (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
    [user.id, 'login', ipAddress, req.headers['user-agent'] || 'Unknown']
  );
  
  console.log('✅ Audit log entry created for user:', user.id);

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
  
  console.log('✅ Cookies set for user:', user.id);

  // Send response with user data (including domain_id for clarity)
  const userData = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    domain_id: user.domain_id
  };

  console.log('✅ LOGIN SUCCESSFUL for user:', user.email);

  const response = {
    message: 'Login successful',
    user: userData,
    accessToken: accessToken
  };

  res.json(response);
});

export const logout = asyncHandler(async (req, res) => {
  console.log('🚪 LOGOUT ATTEMPT:', { userId: req.user?.userId, timestamp: new Date().toISOString(), ip: req.ip });
  
  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  
  console.log('✅ Cookies cleared for user:', req.user?.userId);

  // Log the logout action for audit
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  await pool.query(
    'INSERT INTO audit_log (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
    [req.user.userId, 'logout', ipAddress, req.headers['user-agent'] || 'Unknown']
  );
  
  console.log('✅ Audit log entry created for logout by user:', req.user.userId);

  res.json({ message: 'Logout successful' });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  console.log('🔄 TOKEN REFRESH ATTEMPT:', { timestamp: new Date().toISOString(), ip: req.ip });

  if (!refreshToken) {
    console.log('❌ TOKEN REFRESH FAILED: No refresh token provided');
    return res.status(401).json({ error: 'Refresh token required' });
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    console.log('❌ TOKEN REFRESH FAILED: Invalid refresh token');
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
  
  console.log('✅ Refresh token verified for user:', decoded.userId);

  // Find user
  const userResult = await pool.query(
    'SELECT id, username, email, role, domain_id FROM users WHERE id = $1 AND email = $2',
    [decoded.userId, decoded.email]
  );

  if (userResult.rows.length === 0) {
    console.log('❌ TOKEN REFRESH FAILED: User not found for refresh token:', decoded.userId);
    return res.status(403).json({ error: 'Invalid refresh token' });
  }

  const user = userResult.rows[0];
  
  console.log('✅ User found for token refresh:', user.id);

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
  
  console.log('✅ Domain lookup completed for token refresh:', { userId: user.id, domainId, domainName });

  // Generate new tokens with both domain name and ID
  const userWithDomainInfo = {
    ...user,
    domain: domainName,      // Domain name for UI display
    domain_id: domainId      // Domain ID for backend operations
  };

  const newAccessToken = generateAccessToken(userWithDomainInfo);
  const newRefreshToken = generateRefreshToken(userWithDomainInfo);
  
  console.log('✅ New tokens generated for user:', user.id);

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  });
});