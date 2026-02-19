/**
 * Authentication Routes
 * Handles user registration, login, logout, and password reset
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter, passwordResetLimiter, emailVerificationLimiter } = require('../middleware/rateLimiting');
const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email/emailVerification');
const { setAuthCookies, clearAuthCookies, getRefreshToken } = require('../config/cookies');
const logger = require('../config/logger');
const UsageLog = require('../models/UsageLog');
const { sendSuccess, sendError, sendValidationError, sendUnauthorized, sendNotFound, asyncHandler } = require('../utils/responseHandlers');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, validate(schemas.register), asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    logger.security.suspicious('DUPLICATE_REGISTRATION', null, {
      email: email.toLowerCase(),
      ip: req.ip
    });
    return sendError(res, 409, 'Email already registered');
  }

  // Generate email verification token
  const { token: verificationToken, hash: verificationHash, expires: verificationExpires } = generateVerificationToken();

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    password, // Will be hashed by User model pre-save hook
    name,
    subscriptionTier: 'free',
    emailVerified: false,
    emailVerificationToken: verificationHash,
    emailVerificationExpires: verificationExpires
  });

  // Send verification email
  try {
    await sendVerificationEmail(email, verificationToken, name);
  } catch (emailError) {
    logger.error('Failed to send verification email', {
      userId: user._id,
      email: email.toLowerCase(),
      error: emailError.message
    });
    // Continue with registration even if email fails
  }

  // Generate tokens (user can still use app with limited features)
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save(); // Save refresh token

  // Set httpOnly cookies (secure JWT storage)
  setAuthCookies(res, accessToken, refreshToken);

  // Log registration
  logger.security.auth('REGISTER', user._id, {
    email: email.toLowerCase(),
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  await UsageLog.create({
    user: user._id,
    eventType: 'user_registered',
    metadata: {
      subscriptionTier: 'free',
      emailVerified: false
    }
  });

  sendSuccess(res, {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      emailVerified: user.emailVerified,
      role: user.role
    },
    emailVerificationSent: true,
    // Note: Tokens now in httpOnly cookies for security
    authMethod: 'cookie'
  }, 201, 'Registration successful. Please check your email to verify your account.');
}));

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', authLimiter, validate(schemas.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    logger.security.failedLogin(email.toLowerCase(), req.ip, {
      reason: 'user_not_found',
      userAgent: req.get('user-agent')
    });
    return sendUnauthorized(res, 'Invalid email or password');
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    const lockTimeRemaining = Math.ceil((user.accountLockedUntil - new Date()) / 1000 / 60);
    logger.security.accountLocked(user._id, user.email, req.ip, {
      lockTimeRemaining,
      userAgent: req.get('user-agent')
    });
    return sendError(res, 423, 'Account temporarily locked due to multiple failed login attempts', {
      lockedUntil: user.accountLockedUntil,
      minutesRemaining: lockTimeRemaining,
      message: `Please try again in ${lockTimeRemaining} minute${lockTimeRemaining > 1 ? 's' : ''}`
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Increment failed attempts
    await user.incrementFailedAttempts();

    logger.security.failedLogin(email.toLowerCase(), req.ip, {
      userId: user._id,
      reason: 'invalid_password',
      failedAttempts: user.failedLoginAttempts,
      userAgent: req.get('user-agent')
    });

    const remainingAttempts = Math.max(5 - user.failedLoginAttempts, 0);
    return sendError(res, 401, 'Invalid email or password', {
      remainingAttempts: remainingAttempts,
      ...(remainingAttempts === 0 && {
        message: 'Account will be locked for 15 minutes after next failed attempt'
      })
    });
  }

  // Reset failed attempts on successful login
  await user.resetFailedAttempts();

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save(); // Save refresh token

  // Set httpOnly cookies (secure JWT storage)
  setAuthCookies(res, accessToken, refreshToken);

  // Log successful login
  logger.security.auth('LOGIN_SUCCESS', user._id, {
    email: user.email,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    emailVerified: user.emailVerified
  });

  await UsageLog.create({
    user: user._id,
    eventType: 'user_login',
    metadata: {
      subscriptionTier: user.subscriptionTier,
      emailVerified: user.emailVerified
    }
  });

  const responseData = {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      emailVerified: user.emailVerified,
      role: user.role,
      usageStats: user.usageStats
    },
    // Note: Tokens now in httpOnly cookies for security
    authMethod: 'cookie'
  };

  // Include token in response for test environment
  if (process.env.NODE_ENV === 'test') {
    responseData.token = accessToken;
    responseData.refreshToken = refreshToken;
  }

  sendSuccess(res, responseData, 200, 'Login successful');
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  // Get refresh token from cookie or request body
  const refreshToken = getRefreshToken(req);

  if (!refreshToken) {
    return sendError(res, 401, 'No refresh token provided', {
      message: 'Please log in again'
    });
  }

  // Verify refresh token
  const jwt = require('jsonwebtoken');
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Invalid refresh token');
    }
    throw error;
  }

  // Find user and validate token
  const user = await User.findById(decoded.userId);
  if (!user) {
    return sendUnauthorized(res, 'Invalid refresh token');
  }

  // Check if refresh token exists and is valid
  const tokenExists = user.refreshTokens.some(
    rt => rt.token === refreshToken && rt.expiresAt > new Date()
  );

  if (!tokenExists) {
    return sendUnauthorized(res, 'Invalid or expired refresh token');
  }

  // Generate new access token
  const newAccessToken = user.generateAccessToken();

  // Set new access token in cookie
  res.cookie('accessToken', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/'
  });

  sendSuccess(res, {
    authMethod: 'cookie'
  }, 200, 'Access token refreshed');
}));

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token and clear cookies)
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // Get refresh token from cookie or request body
  const refreshToken = getRefreshToken(req);

  if (refreshToken) {
    // Remove the specific refresh token
    req.user.refreshTokens = req.user.refreshTokens.filter(
      rt => rt.token !== refreshToken
    );
    await req.user.save();
  }

  // Clear httpOnly cookies
  clearAuthCookies(res);

  // Log logout
  logger.security.auth('LOGOUT', req.user._id, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  await UsageLog.create({
    user: req.user._id,
    eventType: 'user_logout'
  });

  sendSuccess(res, null, 200, 'Logout successful. Cookies cleared.');
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  // Reset daily usage if needed
  req.user.resetDailyUsage();
  await req.user.save();

  sendSuccess(res, {
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      subscriptionTier: req.user.subscriptionTier,
      emailVerified: req.user.emailVerified,
      usageStats: req.user.usageStats,
      isPremium: req.user.subscriptionTier === 'premium'
    }
  });
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', validate(schemas.passwordResetRequest), asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success (don't reveal if email exists)
  if (!user) {
    return sendSuccess(res, null, 200, 'If that email exists, a password reset link has been sent');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Send reset email (non-blocking — failure shouldn't expose whether email exists)
  sendPasswordResetEmail(user.email, resetToken, user.name).catch(err => {
    logger.error('Failed to send password reset email', { error: err.message });
  });

  // Log password reset request
  await UsageLog.create({
    user: user._id,
    eventType: 'password_reset_requested'
  });

  // Never expose the reset URL or token in the response — log only to server
  if (process.env.NODE_ENV === 'development') {
    logger.debug('[Auth] Password reset URL (dev only)', { resetUrl });
  }

  sendSuccess(res, {}, 200, 'If that email exists, a password reset link has been sent');
}));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', validate(schemas.passwordResetConfirm), asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // Hash the token to match stored hash
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return sendValidationError(res, 'Invalid or expired reset token');
  }

  // Update password
  user.password = newPassword; // Will be hashed by pre-save hook
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Invalidate all refresh tokens for security
  user.refreshTokens = [];

  await user.save();

  // Log password reset
  await UsageLog.create({
    user: user._id,
    eventType: 'password_reset_completed'
  });

  sendSuccess(res, null, 200, 'Password reset successful. Please login with your new password.');
}));

/**
 * POST /api/auth/verify-email
 * Verify user email address
 */
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return sendValidationError(res, 'Verification token is required');
  }

  // Hash the token to match stored hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid verification token
  const user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return sendError(res, 400, 'Invalid or expired verification token', {
      message: 'The verification link is invalid or has expired. Please request a new one.'
    });
  }

  // Mark email as verified
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // Log verification
  logger.security.emailVerification(user._id, user.email, 'success', {
    ip: req.ip
  });

  await UsageLog.create({
    user: user._id,
    eventType: 'email_verified'
  });

  // Send welcome email
  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (emailError) {
    logger.error('Failed to send welcome email', {
      userId: user._id,
      error: emailError.message
    });
  }

  sendSuccess(res, {
    emailVerified: true
  }, 200, 'Email verified successfully');
}));

/**
 * POST /api/auth/resend-verification
 * Resend email verification link
 */
router.post('/resend-verification', emailVerificationLimiter, authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return sendNotFound(res, 'User');
  }

  if (user.emailVerified) {
    return sendError(res, 400, 'Email already verified', {
      message: 'Your email address has already been verified'
    });
  }

  // Generate new verification token
  const { token: verificationToken, hash: verificationHash, expires: verificationExpires } = generateVerificationToken();

  user.emailVerificationToken = verificationHash;
  user.emailVerificationExpires = verificationExpires;
  await user.save();

  // Send verification email
  await sendVerificationEmail(user.email, verificationToken, user.name);

  logger.security.emailVerification(user._id, user.email, 'resent', {
    ip: req.ip
  });

  sendSuccess(res, null, 200, 'Verification email sent. Please check your inbox.');
}));

module.exports = router;
