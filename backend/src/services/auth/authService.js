const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const jwtService = require('./jwtService');
const emailService = require('./emailService');
const crypto = require('crypto');

/**
 * Authentication Service
 * Handles user registration, login, password reset, etc.
 */

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - { email, password, name }
   * @returns {Object} { user, tokens }
   */
  async register({ email, password, name }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user (password will be hashed by pre-save hook)
    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by model
      name,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
    });

    await user.save();

    // Create free tier subscription
    const subscription = new Subscription({
      user: user._id,
      tier: 'free',
      status: 'active',
      currentPeriodStart: new Date(),
      // Free tier has no end date
    });

    await subscription.save();

    // Generate email verification token
    const verificationToken = this.generateVerificationToken();
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    await user.save();

    // Send verification email (non-blocking)
    emailService
      .sendVerificationEmail(user.email, verificationToken, user.name)
      .catch(err => console.error('Failed to send verification email:', err));

    // Generate JWT tokens
    const tokens = jwtService.generateTokenPair(user);

    // Remove sensitive data before returning
    const userObject = user.toJSON();

    return {
      user: userObject,
      tokens,
    };
  }

  /**
   * Login user with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Object} { user, tokens }
   */
  async login(email, password) {
    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update login stats
    user.lastLoginAt = new Date();
    user.loginCount += 1;
    await user.save();

    // Generate tokens
    const tokens = jwtService.generateTokenPair(user);

    // Remove sensitive data
    const userObject = user.toJSON();

    return {
      user: userObject,
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken
   * @returns {Object} { accessToken, refreshToken }
   */
  async refreshToken(refreshToken) {
    // Verify refresh token
    const decoded = jwtService.verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new token pair
    const tokens = jwtService.generateTokenPair(user);

    return tokens;
  }

  /**
   * Request password reset
   * @param {string} email
   * @returns {boolean} Success status
   */
  async requestPasswordReset(email) {
    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists (security best practice)
    if (!user) {
      return true;
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email (non-blocking)
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.name);
    } catch (error) {
      // If email fails, clear the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new Error('Failed to send password reset email');
    }

    return true;
  }

  /**
   * Reset password using reset token
   * @param {string} resetToken
   * @param {string} newPassword
   * @returns {Object} { user, tokens }
   */
  async resetPassword(resetToken, newPassword) {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new tokens
    const tokens = jwtService.generateTokenPair(user);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  /**
   * Verify email with verification token
   * @param {string} verificationToken
   * @returns {boolean} Success status
   */
  async verifyEmail(verificationToken) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
    }).select('+emailVerificationToken');

    if (!user) {
      throw new Error('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return true;
  }

  /**
   * Change password for authenticated user
   * @param {string} userId
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {boolean} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update to new password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    return true;
  }

  /**
   * Get user by ID with subscription info
   * @param {string} userId
   * @returns {Object} User with subscription
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const subscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'trial'] },
    });

    return {
      user: user.toJSON(),
      subscription: subscription ? subscription.toJSON() : null,
    };
  }

  /**
   * Update user profile
   * @param {string} userId
   * @param {Object} updates - { name, preferences }
   * @returns {Object} Updated user
   */
  async updateProfile(userId, updates) {
    const allowedUpdates = ['name', 'preferences'];
    const updateData = {};

    // Filter only allowed updates
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.toJSON();
  }

  /**
   * Delete user account
   * @param {string} userId
   * @param {string} password - Require password confirmation
   * @returns {boolean} Success status
   */
  async deleteAccount(userId, password) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Delete associated data
    await Subscription.deleteMany({ user: userId });
    // TODO: Delete other associated data (saved searches, chat history, etc.)

    // Delete user
    await User.findByIdAndDelete(userId);

    return true;
  }

  /**
   * Generate email verification token
   * @private
   * @returns {string} Verification token
   */
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = new AuthService();
