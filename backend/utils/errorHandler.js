/**
 * Centralized error handling utilities
 */

// Application-specific error classes
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, true);
    this.details = details;
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, true);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Authorization failed') {
    super(message, 403, true);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, true);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, true);
    this.name = 'DatabaseError';
  }
}

// Error response formatter
export const formatErrorResponse = (error, req, res) => {
  // Log the error for debugging (only non-operational errors in production)
  if (process.env.NODE_ENV !== 'production' || !error.isOperational) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  }

  // Operational errors (expected) vs Programming errors (unexpected)
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      error: error.message,
      ...(error.details && { details: error.details })
    });
  }

  // Programming errors or unexpected errors
  return res.status(500).json({
    status: 'error',
    error: 'Something went wrong! Please try again later.'
  });
};

// Global error handling middleware
export const globalErrorHandler = (err, req, res, next) => {
  // If error is not an instance of AppError, create a generic one
  if (!(err instanceof AppError)) {
    const error = new AppError(
      err.message || 'Internal server error',
      err.statusCode || 500,
      err.isOperational !== false // Default to true if not explicitly set to false
    );
    
    return formatErrorResponse(error, req, res);
  }

  // Format and send the error response
  return formatErrorResponse(err, req, res);
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  formatErrorResponse,
  globalErrorHandler,
  asyncHandler
};