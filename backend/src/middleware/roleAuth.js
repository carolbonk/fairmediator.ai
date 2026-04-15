/**
 * Enhanced Role-Based Authentication Middleware
 * Enforces strict role separation with JWT claims validation
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAccessToken } = require('../config/cookies');
const logger = require('../config/logger');

// Validate required secrets
if (!process.env.JWT_SECRET || !process.env.JWT_ROLE_SECRET) {
  throw new Error('JWT_SECRET and JWT_ROLE_SECRET environment variables are required');
}

// Role hierarchy and permissions
const ROLE_HIERARCHY = {
  admin: 4,      // System administrators
  mediator: 3,   // Supply-side users
  attorney: 2,   // Demand-side users
  party: 1,      // Constrained portal users
  guest: 0       // Unauthenticated
};

// Feature permissions by role
const ROLE_PERMISSIONS = {
  mediator: [
    'mediator.profile.read',
    'mediator.profile.write',
    'mediator.earnings.read',
    'mediator.analytics.read',
    'mediator.services.write',
    'mediator.cases.read',
    'common.messaging'
  ],
  attorney: [
    'attorney.cases.write',
    'attorney.mediators.search',
    'attorney.mediators.bookmark',
    'attorney.reports.generate',
    'attorney.analytics.read',
    'attorney.firm.read',
    'common.messaging'
  ],
  party: [
    'party.case.read',
    'party.documents.write',
    'party.odr.join',
    'party.mediator.view'
  ],
  admin: ['*'] // All permissions
};

/**
 * Generate role-specific JWT token
 */
const generateRoleToken = (user) => {
  const role = user.accountType || user.role || 'guest';

  // Create role-specific claims
  const claims = {
    userId: user._id,
    email: user.email,
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
    tier: user.subscriptionTier || 'free',
    // Add role-specific namespace to prevent cross-role token usage
    namespace: `fairmediator:${role}`,
    // Add session fingerprint for additional security
    fingerprint: generateSessionFingerprint(user._id, role)
  };

  // Sign with combined secret for role isolation
  const roleSecret = `${process.env.JWT_SECRET}:${process.env.JWT_ROLE_SECRET}:${role}`;

  return jwt.sign(claims, roleSecret, {
    expiresIn: '2h', // Shorter expiry for sensitive roles
    issuer: 'fairmediator',
    audience: `fairmediator-${role}`,
    subject: user._id.toString()
  });
};

/**
 * Generate session fingerprint for token binding
 */
const generateSessionFingerprint = (userId, role) => {
  const crypto = require('crypto');
  const timestamp = Date.now();
  const data = `${userId}:${role}:${timestamp}:${process.env.JWT_ROLE_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
};

/**
 * Validate role-specific JWT token
 */
const validateRoleToken = async (token, expectedRole) => {
  try {
    // Use role-specific secret for validation
    const roleSecret = `${process.env.JWT_SECRET}:${process.env.JWT_ROLE_SECRET}:${expectedRole}`;
    const decoded = jwt.verify(token, roleSecret, {
      issuer: 'fairmediator',
      audience: `fairmediator-${expectedRole}`
    });

    // Validate role claim matches
    if (decoded.role !== expectedRole) {
      throw new Error('Role mismatch in token');
    }

    // Validate namespace
    if (decoded.namespace !== `fairmediator:${expectedRole}`) {
      throw new Error('Invalid token namespace');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Token validation failed: ${error.message}`);
  }
};

/**
 * Enhanced authenticate middleware with role validation
 */
const authenticateWithRole = (expectedRoles = []) => {
  return async (req, res, next) => {
    try {
      const token = getAccessToken(req);

      if (!token) {
        return res.status(401).json({
          error: 'No token provided',
          message: 'Authentication required'
        });
      }

      // Decode token to get role claim
      const decodedBasic = jwt.decode(token);
      if (!decodedBasic || !decodedBasic.role) {
        return res.status(401).json({
          error: 'Invalid token structure',
          message: 'Token missing required claims'
        });
      }

      // Validate token with role-specific secret
      const decoded = await validateRoleToken(token, decodedBasic.role);

      // Check if role is allowed for this endpoint
      const rolesArray = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
      if (rolesArray.length > 0 && !rolesArray.includes(decoded.role)) {
        logger.security.unauthorized('ROLE_ACCESS_DENIED', decoded.userId, {
          required: rolesArray,
          actual: decoded.role,
          endpoint: req.path
        });

        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This endpoint requires one of: ${rolesArray.join(', ')}`,
          requiredRoles: rolesArray,
          currentRole: decoded.role
        });
      }

      // Get fresh user data from database
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Verify user role hasn't changed
      const currentRole = user.accountType || user.role;
      if (currentRole !== decoded.role) {
        logger.security.suspicious('ROLE_CHANGE_DETECTED', user._id, {
          tokenRole: decoded.role,
          dbRole: currentRole
        });
        return res.status(401).json({
          error: 'Role mismatch',
          message: 'Your role has changed. Please log in again.'
        });
      }

      // Attach enhanced user object to request
      req.user = user;
      req.auth = {
        role: decoded.role,
        permissions: decoded.permissions,
        tier: decoded.tier,
        fingerprint: decoded.fingerprint
      };

      // Log successful authentication
      logger.debug('Role-based auth successful', {
        userId: user._id,
        role: decoded.role,
        endpoint: req.path
      });

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }

      logger.error('Role authentication error', {
        error: error.message,
        path: req.path
      });
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
};

/**
 * Check specific permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin has all permissions
    if (req.auth.role === 'admin' ||
        req.auth.permissions.includes('*') ||
        req.auth.permissions.includes(permission)) {
      return next();
    }

    logger.security.unauthorized('PERMISSION_DENIED', req.user._id, {
      required: permission,
      available: req.auth.permissions,
      endpoint: req.path
    });

    return res.status(403).json({
      error: 'Permission denied',
      message: `This action requires permission: ${permission}`,
      requiredPermission: permission
    });
  };
};

/**
 * Middleware to prevent cross-role access
 */
const preventCrossRoleAccess = async (req, res, next) => {
  try {
    // Check if user is trying to access resources outside their role
    const path = req.path.toLowerCase();
    const userRole = req.auth?.role || 'guest';

    const roleRouteMap = {
      mediator: ['/api/mediators', '/dashboard/mediator'],
      attorney: ['/api/attorneys', '/api/cases', '/firm'],
      party: ['/api/parties', '/case/']
    };

    // Check each role's routes
    for (const [role, routes] of Object.entries(roleRouteMap)) {
      if (role !== userRole && routes.some(route => path.includes(route))) {
        logger.security.suspicious('CROSS_ROLE_ACCESS_ATTEMPT', req.user?._id, {
          userRole,
          attemptedPath: path,
          blockedRole: role
        });

        return res.status(403).json({
          error: 'Cross-role access denied',
          message: `Your role (${userRole}) cannot access ${role} resources`,
          userRole,
          blockedPath: path
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Cross-role check error', { error: error.message });
    next(); // Allow request to continue on error
  }
};

/**
 * Audit sensitive data access
 */
const auditDataAccess = (dataType) => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data) {
      const responseTime = Date.now() - startTime;

      // Log the access
      logger.security.dataAccess(req.user?._id, {
        dataType,
        endpoint: req.path,
        method: req.method,
        role: req.auth?.role,
        responseTime,
        recordCount: Array.isArray(data?.data) ? data.data.length : 1,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  authenticateWithRole,
  requirePermission,
  preventCrossRoleAccess,
  auditDataAccess,
  generateRoleToken,
  validateRoleToken,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS
};