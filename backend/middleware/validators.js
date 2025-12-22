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
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters long'),
    body('role')
        .isIn(['user', 'contributor', 'domain_admin', 'super_admin'])
        .withMessage('Role must be one of: user, contributor, domain_admin, super_admin'),
    body('domain_id')
        .optional()
        .custom((value, { req }) => {
            // Domain is only required for contributors
            if (req.body.role === 'contributor') {
                if (value === undefined || value === null || value.toString().trim() === '') {
                    throw new Error('Domain is required for contributors');
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
            if (value.length < 6 || value.length > 128) {
                throw new Error('Password must be between 6 and 128 characters long');
            }
            return true;
        }),
    body('role')
        .optional()
        .isIn(['user', 'contributor', 'domain_admin', 'super_admin'])
        .withMessage('Role must be one of: user, contributor, domain_admin, super_admin'),
    body('domain_id')
        .optional()
        .custom((value, { req }) => {
            // Domain is only required for contributors
            const newRole = req.body.role;
            if (newRole === 'contributor') {
                if (value === undefined || value === null || value.toString().trim() === '') {
                    throw new Error('Domain is required for contributors');
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
    body('domain_id')
        .custom((value, { req }) => {
            // For contributors, domain is required and will be set by the system
            // For admins, domain must be provided
            if (req.user && (req.user.role === 'super_admin' || req.user.role === 'domain_admin')) {
                if (!value && value !== 0) {
                    throw new Error('Domain is required for admin-created articles');
                }

                // Convert to integer if it's a string
                const domainId = parseInt(value);

                // Check if it's a valid integer
                if (isNaN(domainId) || domainId <= 0) {
                    throw new Error('Domain must be a valid positive integer');
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