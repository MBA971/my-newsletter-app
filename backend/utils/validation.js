/**
 * Validation utilities for the application
 */

import { body, validationResult } from 'express-validator';

// Validation result handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validation rules for user login
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters long')
];

// Validation rules for user registration/creation
export const validateUser = [
  body('username')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),
  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters long'),
  body('role')
    .optional({ checkFalsy: true })
    .isIn(['user', 'contributor', 'domain_admin', 'super_admin'])
    .withMessage('Role must be one of: user, contributor, domain_admin, super_admin'),
  body('domain_id')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '' || value === 'null') return true;
      const parsed = parseInt(value);
      if (!isNaN(parsed) && parsed > 0) return true;
      throw new Error('Domain must be a valid integer ID');
    })
];

// Validation rules for domain creation/update
export const validateDomain = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Domain name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Domain name can only contain letters, numbers, spaces, hyphens, and underscores'),
  body('color')
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage('Color must be between 4 and 20 characters')
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^[a-zA-Z]+$/)
    .withMessage('Color must be a valid hex code or color name')
];

// Validation rules for news articles
export const validateNews = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('domain_id')
    .isInt({ min: 1 })
    .withMessage('Domain must be a valid integer ID')
    .toInt(),
  body('author')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Author name must not exceed 100 characters')
];

// Validation rules for subscriber creation
export const validateSubscriber = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters')
];

// Sanitization utility for content
export const sanitizeContent = (content) => {
  if (typeof content !== 'string') return content;

  // Basic HTML sanitization - remove potentially dangerous tags
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
};