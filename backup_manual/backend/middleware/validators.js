import { body, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
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
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Domain must be between 1 and 50 characters'),
    handleValidationErrors
];

// Validation rules for news creation
export const validateNewsCreation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters')
        .escape(),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Content is required')
        .isLength({ min: 10, max: 5000 })
        .withMessage('Content must be between 10 and 5000 characters')
        .escape(),
    body('domain')
        .trim()
        .notEmpty()
        .withMessage('Domain is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Domain must be between 1 and 50 characters'),
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
        .withMessage('Name must be between 2 and 100 characters')
        .escape(),
    handleValidationErrors
];
