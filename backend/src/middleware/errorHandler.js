const mongoose = require('mongoose');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
    console.error('Error Details:', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404,
      isOperational: true
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = {
      message,
      statusCode: 400,
      isOperational: true
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = errors.join('. ');
    error = {
      message,
      statusCode: 400,
      isOperational: true,
      validationErrors: errors
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: 401,
      isOperational: true
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      statusCode: 401,
      isOperational: true
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = {
      message,
      statusCode: 400,
      isOperational: true
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected field in file upload';
    error = {
      message,
      statusCode: 400,
      isOperational: true
    };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = {
      message,
      statusCode: 429,
      isOperational: true
    };
  }

  // MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    let message = 'Database error';
    let statusCode = 500;

    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      message = `${field} already exists`;
      statusCode = 400;
    }

    error = {
      message,
      statusCode,
      isOperational: true
    };
  }

  // Express-validator errors
  if (err.type === 'validation') {
    const message = err.errors.map(e => e.msg).join('. ');
    error = {
      message,
      statusCode: 400,
      isOperational: true,
      validationErrors: err.errors
    };
  }

  // File system errors
  if (err.code === 'ENOENT') {
    const message = 'File not found';
    error = {
      message,
      statusCode: 404,
      isOperational: true
    };
  }

  if (err.code === 'EACCES') {
    const message = 'Permission denied';
    error = {
      message,
      statusCode: 403,
      isOperational: true
    };
  }

  // AWS S3 errors
  if (err.code === 'NoSuchBucket') {
    const message = 'Storage bucket not found';
    error = {
      message,
      statusCode: 500,
      isOperational: true
    };
  }

  if (err.code === 'AccessDenied') {
    const message = 'Storage access denied';
    error = {
      message,
      statusCode: 500,
      isOperational: true
    };
  }

  // Payment errors (if using payment gateway)
  if (err.type === 'StripeCardError') {
    const message = err.message || 'Payment failed';
    error = {
      message,
      statusCode: 400,
      isOperational: true
    };
  }

  // Email service errors
  if (err.code === 'EAUTH') {
    const message = 'Email authentication failed';
    error = {
      message,
      statusCode: 500,
      isOperational: true
    };
  }

  // Default error response
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const isOperational = error.isOperational || false;

  // Prepare error response
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    }),
    ...(error.validationErrors && {
      validationErrors: error.validationErrors
    })
  };

  // Log error for monitoring (in production)
  if (process.env.NODE_ENV === 'production' && (!isOperational || statusCode >= 500)) {
    console.error('ERROR:', {
      message,
      statusCode,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : null
    });

    // Here you could integrate with error tracking services like:
    // - Sentry
    // - Bugsnag
    // - Rollbar
    // - Winston for file logging
  }

  res.status(statusCode).json(errorResponse);
};

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Validation error handler
const handleValidationError = (errors) => {
  return (req, res, next) => {
    if (errors && errors.length > 0) {
      const validationErrors = errors.map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      const error = new AppError('Validation failed', 400);
      error.validationErrors = validationErrors;
      return next(error);
    }
    next();
  };
};

// Database connection error handler
const handleDBConnection = (err) => {
  console.error('Database connection error:', err.message);
  
  // Graceful shutdown
  process.exit(1);
};

// Unhandled promise rejection handler
const handleUnhandledRejection = (err) => {
  console.error('UNHANDLED PROMISE REJECTION! Shutting down...');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Close server gracefully
  if (global.server) {
    global.server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

// Uncaught exception handler
const handleUncaughtException = (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  process.exit(1);
};

module.exports = {
  errorHandler,
  AppError,
  asyncHandler,
  notFound,
  handleValidationError,
  handleDBConnection,
  handleUnhandledRejection,
  handleUncaughtException
};
