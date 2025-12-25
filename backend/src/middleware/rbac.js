/**
 * Role-Based Access Control (RBAC) Middleware
 * Manages permissions and access control for different user roles
 */

const logger = require('../config/logger');

/**
 * Role hierarchy and default permissions
 */
const ROLE_PERMISSIONS = {
  user: [
    'read:mediators'
  ],
  moderator: [
    'read:mediators',
    'write:mediators',
    'scrape:data'
  ],
  admin: [
    'read:mediators',
    'write:mediators',
    'delete:mediators',
    'manage:users',
    'manage:subscriptions',
    'access:admin',
    'scrape:data'
  ]
};

/**
 * Check if user has required role
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Convert single role to array
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    // Check if user has one of the required roles
    if (!requiredRoles.includes(req.user.role)) {
      logger.security.accessDenied(
        req.user._id,
        req.originalUrl,
        'role_check',
        {
          requiredRoles,
          userRole: req.user.role,
          method: req.method
        }
      );

      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires ${requiredRoles.join(' or ')} role`,
        requiredRole: requiredRoles,
        currentRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Check if user has required permission
 * @param {string|string[]} permissions - Required permission(s)
 * @returns {Function} Express middleware
 */
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Convert single permission to array
    const requiredPerms = Array.isArray(permissions) ? permissions : [permissions];

    // Get user's permissions (from role + custom permissions)
    const rolePermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const customPermissions = req.user.permissions || [];
    const userPermissions = [...new Set([...rolePermissions, ...customPermissions])];

    // Check if user has all required permissions
    const hasPermission = requiredPerms.every(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      logger.security.accessDenied(
        req.user._id,
        req.originalUrl,
        'permission_check',
        {
          requiredPermissions: requiredPerms,
          userPermissions,
          userRole: req.user.role,
          method: req.method
        }
      );

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
        requiredPermissions: requiredPerms
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = requireRole('admin');

/**
 * Check if user is at least moderator
 */
const requireModerator = requireRole(['moderator', 'admin']);

/**
 * Check if user can access their own resource or is admin
 * @param {string} userIdParam - Name of the URL parameter containing user ID
 */
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    const currentUserId = req.user._id.toString();

    // Allow if user is admin or accessing their own resource
    if (req.user.role === 'admin' || resourceUserId === currentUserId) {
      return next();
    }

    logger.security.accessDenied(
      req.user._id,
      req.originalUrl,
      'ownership_check',
      {
        resourceUserId,
        currentUserId,
        userRole: req.user.role,
        method: req.method
      }
    );

    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own resources'
    });
  };
};

/**
 * Get user permissions (for debugging/frontend)
 */
const getUserPermissions = (user) => {
  if (!user) return [];

  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const customPermissions = user.permissions || [];

  return [...new Set([...rolePermissions, ...customPermissions])];
};

/**
 * Check if user has permission (non-middleware version)
 */
const hasPermission = (user, permission) => {
  const permissions = getUserPermissions(user);
  return permissions.includes(permission);
};

module.exports = {
  requireRole,
  requirePermission,
  requireAdmin,
  requireModerator,
  requireOwnershipOrAdmin,
  getUserPermissions,
  hasPermission,
  ROLE_PERMISSIONS
};
