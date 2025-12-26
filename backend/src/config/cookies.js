/**
 * Cookie Configuration for Secure JWT Storage
 * Uses httpOnly cookies to prevent XSS attacks on JWT tokens
 */

/**
 * Cookie configuration for access tokens (15 minutes)
 */
const accessTokenCookieOptions = {
  httpOnly: true,  // Prevents JavaScript access (XSS protection)
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'strict',  // CSRF protection
  maxAge: 15 * 60 * 1000,  // 15 minutes
  path: '/',
  signed: false  // We're using JWT signing instead
};

/**
 * Cookie configuration for refresh tokens (30 days)
 */
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
  path: '/api/auth/refresh',  // Only sent to refresh endpoint
  signed: false
};

/**
 * Set authentication cookies on response
 * @param {Response} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, accessTokenCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
};

/**
 * Clear authentication cookies
 * @param {Response} res - Express response object
 */
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
};

/**
 * Get access token from cookie or Authorization header
 * Supports both cookie-based and header-based authentication
 * @param {Request} req - Express request object
 * @returns {string|null} - Access token or null
 */
const getAccessToken = (req) => {
  // Priority 1: Check cookies (more secure)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  // Priority 2: Check Authorization header (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Get refresh token from cookie or request body
 * @param {Request} req - Express request object
 * @returns {string|null} - Refresh token or null
 */
const getRefreshToken = (req) => {
  // Priority 1: Check cookies
  if (req.cookies && req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }

  // Priority 2: Check request body (for API clients)
  if (req.body && req.body.refreshToken) {
    return req.body.refreshToken;
  }

  return null;
};

module.exports = {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  setAuthCookies,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken
};
