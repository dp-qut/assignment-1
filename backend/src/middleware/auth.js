const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is missing'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Authorization middleware for roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Middleware to check if user owns the resource
const authorizeOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // For regular users, check ownership
    const resourceUserId = req.resource && req.resource[resourceField];
    
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Middleware to verify email before accessing certain routes
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required to access this resource'
    });
  }

  next();
};

// Middleware to check application ownership or admin access
const checkApplicationAccess = async (req, res, next) => {
  try {
    const Application = require('../models/Application');
    const applicationId = req.params.id || req.params.applicationId;
    
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    const application = await Application.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Admin can access any application
    if (req.user.role === 'admin') {
      req.application = application;
      return next();
    }

    // User can only access their own applications
    if (application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own applications.'
      });
    }

    req.application = application;
    next();
  } catch (error) {
    console.error('Application access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking application access'
    });
  }
};

// Middleware to log user activity
const logUserActivity = (action) => {
  return (req, res, next) => {
    // Store activity info in request for later logging
    req.userActivity = {
      userId: req.user ? req.user._id : null,
      action,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      route: req.originalUrl,
      method: req.method
    };
    
    next();
  };
};

// Middleware to validate API key (for webhook endpoints)
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }

  if (apiKey !== process.env.WEBHOOK_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  next();
};

// Middleware to check if user can perform action based on application status
const checkApplicationStatus = (allowedStatuses) => {
  return (req, res, next) => {
    if (!req.application) {
      return res.status(400).json({
        success: false,
        message: 'Application not found in request'
      });
    }

    if (!allowedStatuses.includes(req.application.status)) {
      return res.status(400).json({
        success: false,
        message: `Action not allowed for application with status: ${req.application.status}`
      });
    }

    next();
  };
};

// Middleware to refresh user data
const refreshUserData = async (req, res, next) => {
  try {
    if (req.user && req.user._id) {
      const freshUser = await User.findById(req.user._id).select('-password');
      if (freshUser) {
        req.user = freshUser;
      }
    }
    next();
  } catch (error) {
    console.error('Error refreshing user data:', error);
    next(); // Continue even if refresh fails
  }
};

module.exports = {
  authenticateToken,
  protect: authenticateToken, // Alias for compatibility
  authorizeRoles,
  authorize: authorizeRoles, // Alias for compatibility
  authorizeOwnership,
  requireEmailVerification,
  checkApplicationAccess,
  logUserActivity,
  validateApiKey,
  checkApplicationStatus,
  refreshUserData
};
