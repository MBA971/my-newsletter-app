import jwt from 'jsonwebtoken';
import config from '../config/config.js';

const { secret: JWT_SECRET, refreshSecret: JWT_REFRESH_SECRET, accessExpiration, refreshExpiration } = config.jwt;

// Middleware to authenticate JWT token
export const authenticateToken = (req, res, next) => {
    // Try to get token from cookie first, then from Authorization header
    const token = req.cookies?.accessToken || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
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
export const requireAdmin = requireRole('super_admin');

// Shortcut middleware for contributor or admin
export const requireContributor = requireRole('contributor', 'domain_admin', 'super_admin');

// Shortcut middleware for super admin only
export const requireSuperAdmin = requireRole('super_admin');

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
    if (req.user.role === 'super_admin') {
        return next();
    }

    // Domain admins can access their own domain
    if (req.user.role === 'domain_admin') {
        // Get the user's domain from the database
        // For now, we'll allow domain admins to access their assigned domain
        // In a more complete implementation, we might want to check the specific domain
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
    const payload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        domain: user.domain
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: accessExpiration });
};

// Generate refresh token
export const generateRefreshToken = (user) => {
    const payload = {
        userId: user.id,
        email: user.email
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: refreshExpiration });
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};
