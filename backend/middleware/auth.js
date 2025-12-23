import jwt from 'jsonwebtoken';
import config from '../config/config.js';

const { secret: JWT_SECRET, refreshSecret: JWT_REFRESH_SECRET, accessExpiration, refreshExpiration } = config.jwt;

// Middleware to authenticate JWT token
export const authenticateToken = (req, res, next) => {
    console.log('🔐 AUTH MIDDLEWARE CALLED:', { url: req.url, method: req.method, timestamp: new Date().toISOString() });
    
    // Try to get token from cookie first, then from Authorization header
    const token = req.cookies?.accessToken || req.headers['authorization']?.split(' ')[1];
    
    console.log('🔐 TOKEN RETRIEVAL:', { hasCookieToken: !!req.cookies?.accessToken, hasHeaderToken: !!req.headers['authorization'], hasToken: !!token });

    if (!token) {
        console.log('❌ NO TOKEN FOUND - ACCESS DENIED');
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        console.log('🔍 VERIFYING TOKEN...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ TOKEN VERIFIED SUCCESSFULLY:', { userId: decoded.userId, role: decoded.role });
        req.user = decoded;
        next();
    } catch (error) {
        console.error(`❌ TOKEN VERIFICATION FAILED: ${error.message}`);
        console.error('❌ ERROR DETAILS:', { errorName: error.name, tokenLength: token?.length });
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
            console.log(`[AUTH DEBUG] User role '${req.user.role}' not in allowed roles: ${JSON.stringify(allowedRoles)}`);
            console.log(`[AUTH DEBUG] User details:`, JSON.stringify(req.user));
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
export const requireAdmin = requireRole('super_admin', 'admin');

// Shortcut middleware for contributor or admin
export const requireContributor = requireRole('contributor', 'domain_admin', 'super_admin');

// Shortcut middleware for super admin only
export const requireSuperAdmin = requireRole('super_admin', 'admin');

// Shortcut middleware for domain admin or super admin
export const requireDomainAdmin = requireRole('domain_admin', 'super_admin');

// Shortcut middleware for contributor, domain admin, or super admin
export const requireContributorOrAdmin = requireRole('contributor', 'domain_admin', 'super_admin');

// Middleware to check if user can modify resource in their domain
export const checkDomainAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Super admin can access all domains
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
        return next();
    }

    // Domain admins can access their own domain
    if (req.user.role === 'domain_admin') {
        // For domain admins, we'll allow access to their assigned domain
        // The domain ID is stored in the JWT token
        return next();
    }

    // Contributors can only access their own domain
    if (req.user.role === 'contributor') {
        const requestedDomain = req.body.domain_id || req.params.domain_id || req.query.domain_id;

        // If a specific domain is requested and it's not the user's domain, deny access
        if (requestedDomain && parseInt(requestedDomain) !== parseInt(req.user.domain_id)) {
            return res.status(403).json({
                error: 'You can only manage content in your assigned domain',
                yourDomain: req.user.domain_id,
                requestedDomain
            });
        }
    }

    next();
};

// Generate access token
export const generateAccessToken = (user) => {
    console.log('🔐 GENERATING ACCESS TOKEN FOR USER:', { userId: user.id, role: user.role });
    
    const payload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        domain_id: user.domain_id,
        domain_name: user.domain_name
    };
    
    console.log('🔐 TOKEN PAYLOAD:', payload);

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: accessExpiration });
    console.log('🔐 ACCESS TOKEN GENERATED, LENGTH:', token.length);
    
    return token;
};

// Generate refresh token
export const generateRefreshToken = (user) => {
    console.log('🔄 GENERATING REFRESH TOKEN FOR USER:', { userId: user.id });
    
    const payload = {
        userId: user.id,
        email: user.email
    };
    
    console.log('🔄 REFRESH TOKEN PAYLOAD:', payload);

    const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: refreshExpiration });
    console.log('🔄 REFRESH TOKEN GENERATED, LENGTH:', token.length);
    
    return token;
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
    console.log('🔄 VERIFYING REFRESH TOKEN, LENGTH:', token?.length);
    
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        console.log('✅ REFRESH TOKEN VERIFIED SUCCESSFULLY:', { userId: decoded.userId });
        return decoded;
    } catch (error) {
        console.error('❌ REFRESH TOKEN VERIFICATION FAILED:', error.message);
        throw new Error('Invalid refresh token');
    }
};