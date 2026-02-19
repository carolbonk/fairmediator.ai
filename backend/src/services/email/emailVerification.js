/**
 * Email Verification Service
 * Sends verification emails to new users
 */

const crypto = require('crypto');
const logger = require('../../config/logger');
const { verificationEmail, welcomeEmail, passwordResetEmail, accountLockedEmail } = require('./templates');

/**
 * Generate email verification token
 * @returns {Object} { token, hash, expires }
 */
const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { token, hash, expires };
};

/**
 * Send verification email
 * @param {string} email - User email
 * @param {string} token - Verification token
 * @param {string} userName - User name
 */
const sendVerificationEmail = async (email, token, userName) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    // Check if Resend is configured
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'FairMediator <noreply@fairmediator.com>',
        to: email,
        subject: 'Verify your email address - FairMediator',
        html: verificationEmail(userName, verificationUrl)
      });

      logger.info('Email verification sent', { email });
    } else {
      logger.info('Email verification (dev mode)', { email, userName, verificationUrl });
    }

    return true;
  } catch (error) {
    logger.error('Failed to send verification email', {
      email,
      error: error.message,
      stack: error.stack
    });
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send welcome email after verification
 * @param {string} email - User email
 * @param {string} userName - User name
 */
const sendWelcomeEmail = async (email, userName) => {
  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'FairMediator <noreply@fairmediator.com>',
        to: email,
        subject: 'Welcome to FairMediator! 🎉',
        html: welcomeEmail(userName, `${process.env.FRONTEND_URL}/dashboard`)
      });

      logger.info('Welcome email sent', { email });
    } else {
      logger.info('Welcome email (dev mode)', { email });
    }

    return true;
  } catch (error) {
    logger.error('Failed to send welcome email', {
      email,
      error: error.message
    });
    // Don't throw - welcome email is not critical
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} token - Reset token
 * @param {string} userName - User name
 */
const sendPasswordResetEmail = async (email, token, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'FairMediator Security <security@fairmediator.com>',
        to: email,
        subject: 'Password Reset Request - FairMediator',
        html: passwordResetEmail(userName, resetUrl)
      });

      logger.info('Password reset email sent', { email });
    } else {
      logger.info('Password reset email (dev mode)', { email, resetUrl });
    }

    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', {
      email,
      error: error.message
    });
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send account locked notification
 * @param {string} email - User email
 * @param {string} userName - User name
 * @param {number} lockDuration - Lock duration in minutes
 */
const sendAccountLockedEmail = async (email, userName, lockDuration) => {
  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'FairMediator Security <security@fairmediator.com>',
        to: email,
        subject: '🔒 Account Temporarily Locked - FairMediator',
        html: accountLockedEmail(userName, lockDuration)
      });

      logger.info('Account locked notification sent', { email });
    } else {
      logger.info('Account locked email (dev mode)', { email, lockDuration });
    }

    return true;
  } catch (error) {
    logger.error('Failed to send account locked email', {
      email,
      error: error.message
    });
    // Don't throw - this is not critical
    return false;
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendAccountLockedEmail
};
