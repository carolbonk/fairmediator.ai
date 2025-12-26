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
const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } = require('../services/email/emailVerification');
const { setAuthCookies, clearAuthCookies, getRefreshToken } = require('../config/cookies');
const logger = require('../config/logger');
const UsageLog = require('../models/UsageLog');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, validate(schemas.register), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.security.suspicious('DUPLICATE_REGISTRATION', null, {
        email: email.toLowerCase(),
        ip: req.ip
      });
      return res.status(409).json({
        error: 'Email already registered'
      });
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

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
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
      }
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message, stack: error.stack });
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', authLimiter, validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.security.failedLogin(email.toLowerCase(), req.ip, {
        reason: 'user_not_found',
        userAgent: req.get('user-agent')
      });
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      const lockTimeRemaining = Math.ceil((user.accountLockedUntil - new Date()) / 1000 / 60);
      logger.security.accountLocked(user._id, user.email, req.ip, {
        lockTimeRemaining,
        userAgent: req.get('user-agent')
      });
      return res.status(423).json({
        error: 'Account temporarily locked due to multiple failed login attempts',
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
      return res.status(401).json({
        error: 'Invalid email or password',
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

    res.json({
      success: true,
      message: 'Login successful',
      data: {
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
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = getRefreshToken(req);

    if (!refreshToken) {
      return res.status(401).json({
        error: 'No refresh token provided',
        message: 'Please log in again'
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and validate token
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if refresh token exists and is valid
    const tokenExists = user.refreshTokens.some(
      rt => rt.token === refreshToken && rt.expiresAt > new Date()
    );

    if (!tokenExists) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
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

    res.json({
      success: true,
      message: 'Access token refreshed',
      data: {
        authMethod: 'cookie'
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    logger.error('Refresh token error', { error: error.message });
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token and clear cookies)
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
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

    res.json({
      success: true,
      message: 'Logout successful. Cookies cleared.'
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Reset daily usage if needed
    req.user.resetDailyUsage();
    await req.user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name,
          subscriptionTier: req.user.subscriptionTier,
          emailVerified: req.user.emailVerified,
          usageStats: req.user.usageStats,
          isPremium: req.user.subscriptionTier === 'premium'
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', validate(schemas.passwordResetRequest), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send email with reset link
    // For now, just return the token (in production, this would be sent via email)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    console.log('Password reset URL:', resetUrl);

    // Log password reset request
    await UsageLog.create({
      user: user._id,
      eventType: 'password_reset_requested'
    });

    res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent',
      // Remove this in production - only for development
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', validate(schemas.passwordResetConfirm), async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token to match stored hash
    const crypto = require('crypto');
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
      return res.status(400).json({ error: 'Invalid or expired reset token' });
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

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify user email address
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Hash the token to match stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
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

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        emailVerified: true
      }
    });
  } catch (error) {
    logger.error('Email verification error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Email verification failed' });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend email verification link
 */
router.post('/resend-verification', emailVerificationLimiter, authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Email already verified',
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

    res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    logger.error('Resend verification error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

module.exports = router;
