import { body, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    console.log('[DEBUG] Validation errors:', errors.array());
    if (!errors.isEmpty()) {
        console.log('[DEBUG] Validation failed, returning 400');
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    console.log('[DEBUG] Validation passed');
    next();
};

// Validation rules for login
export const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .trim()  // Add trim() to remove leading/trailing whitespace
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    handleValidationErrors
];

// Validation rules for user creation
export const validateUserCreation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('role')
        .isIn(['admin', 'contributor', 'user'])
        .withMessage('Role must be admin, contributor, or user'),
    body('domain')
        .optional()
        .custom((value, { req }) => {
            // Domain is only required for contributors
            if (req.body.role === 'contributor') {
                if (!value || value.toString().trim() === '') {
                    throw new Error('Domain is required for contributors');
                }
                if (value.toString().trim().length < 1 || value.toString().trim().length > 50) {
                    throw new Error('Domain must be between 1 and 50 characters');
                }
            }
            return true;
        }),
    handleValidationErrors
];

// Validation rules for user updates
export const validateUserUpdate = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .optional()
        .custom((value, { req }) => {
            // Only validate password if it's provided and not empty
            if (!value || value.trim() === '') {
                return true; // Skip validation
            }
            // Apply validation rules only when password is provided
            if (value.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            }
            return true;
        }),
    body('role')
        .optional()
        .isIn(['admin', 'contributor', 'user'])
        .withMessage('Role must be admin, contributor, or user'),
    body('domain')
        .optional()
        .custom((value, { req }) => {
            // Domain is only required for contributors
            // We need to check both the new role (if provided) and the existing role
            const newRole = req.body.role;
            // If we're not updating the role, we need to get the existing user's role
            // This would require a database lookup, so we'll just validate based on what's provided
            if (newRole === 'contributor') {
                if (value === undefined || value === null) {
                    // If domain is not provided but required, that's handled in the route logic
                    return true;
                }
                if (value.toString().trim() === '') {
                    throw new Error('Domain is required for contributors');
                }
                if (value.toString().trim().length < 1 || value.toString().trim().length > 50) {
                    throw new Error('Domain must be between 1 and 50 characters');
                }
            }
            return true;
        }),
    handleValidationErrors
];

// Validation rules for news creation
export const validateNewsCreation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters'),
        // Removed .escape() to prevent HTML entity encoding
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Content is required')
        .isLength({ min: 10, max: 5000 })
        .withMessage('Content must be between 10 and 5000 characters'),
        // Removed .escape() to prevent HTML entity encoding
    body('domain')
        .custom((value, { req }) => {
            // For contributors, domain is required and will be set by the system
            // For admins, domain must be provided
            if (req.user && (req.user.role === 'super_admin' || req.user.role === 'domain_admin')) {
                if (!value || value.toString().trim() === '') {
                    throw new Error('Domain is required for admin-created articles');
                }
                if (value.toString().trim().length < 1 || value.toString().trim().length > 50) {
                    throw new Error('Domain must be between 1 and 50 characters');
                }
            }
            // For contributors, domain will be set by the system, so we don't validate it here
            return true;
        }),
    handleValidationErrors
];

// Validation rules for domain creation
export const validateDomainCreation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Domain name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Domain name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z0-9\s]+$/)
        .withMessage('Domain name can only contain letters, numbers, and spaces'),
    body('color')
        .trim()
        .notEmpty()
        .withMessage('Color is required')
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .withMessage('Color must be a valid hex color code'),
    handleValidationErrors
];

// Validation rules for subscriber
export const validateSubscriber = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
        // Removed .escape() to prevent HTML entity encoding
    handleValidationErrors
];