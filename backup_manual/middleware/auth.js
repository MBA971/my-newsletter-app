import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';

console.log('=== AUTH MODULE INITIALIZED ===');
console.log('JWT_SECRET length:', JWT_SECRET.length);
console.log('JWT_REFRESH_SECRET length:', JWT_REFRESH_SECRET.length);
console.log('Using default secrets:', !process.env.JWT_SECRET, !process.env.JWT_REFRESH_SECRET);

// Middleware to authenticate JWT token
export const authenticateToken = (req, res, next) => {
    console.log('=== AUTH MIDDLEWARE CALLED ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Cookies received:', req.cookies);
    console.log('Authorization header:', req.headers['authorization']);
    
    // Try to get token from cookie first, then from Authorization header
    const token = req.cookies?.accessToken || req.headers['authorization']?.split(' ')[1];
    console.log('Token extracted:', token);

    if (!token) {
        console.log('❌ NO ACCESS TOKEN PROVIDED');
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        console.log('Verifying access token...');
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log('✅ TOKEN VERIFIED SUCCESSFULLY:', {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        });
        next();
    } catch (error) {
        console.log('❌ TOKEN VERIFICATION FAILED:', error.name, error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Middleware to check if user has required role
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};

// Shortcut middleware for admin only
export const requireAdmin = requireRole('admin');

// Shortcut middleware for contributor or admin
export const requireContributor = requireRole('contributor', 'admin');

// Middleware to check if user can modify resource in their domain
export const checkDomainAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin can access all domains
    if (req.user.role === 'admin') {
        return next();
    }

    // Contributors can only access their own domain
    if (req.user.role === 'contributor') {
        const requestedDomain = req.body.domain || req.params.domain;

        if (requestedDomain && requestedDomain !== req.user.domain) {
            return res.status(403).json({
                error: 'You can only manage content in your assigned domain',
                yourDomain: req.user.domain,
                requestedDomain
            });
        }
    }

    next();
};

// Generate access token
export const generateAccessToken = (user) => {
    console.log('Generating access token for user:', user.id);
    const payload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        domain: user.domain
    };
    
    console.log('Token payload:', payload);
    console.log('JWT_SECRET length for signing:', JWT_SECRET.length);
    
    const token = jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    console.log('Access token generated successfully, length:', token.length);
    return token;
};

// Generate refresh token
export const generateRefreshToken = (user) => {
    console.log('Generating refresh token for user:', user.id);
    const payload = {
        userId: user.id,
        email: user.email
    };
    
    console.log('Refresh token payload:', payload);
    console.log('JWT_REFRESH_SECRET length for signing:', JWT_REFRESH_SECRET.length);
    
    const token = jwt.sign(
        payload,
        JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    console.log('Refresh token generated successfully, length:', token.length);
    return token;
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};
