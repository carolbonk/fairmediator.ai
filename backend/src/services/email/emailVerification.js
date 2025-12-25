/**
 * Email Verification Service
 * Sends verification emails to new users
 */

const crypto = require('crypto');
const logger = require('../../config/logger');

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
        subject: 'Verify your email address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to FairMediator, ${userName}!</h2>
            <p>Thank you for registering. Please verify your email address to activate your account.</p>
            <p>
              <a href="${verificationUrl}"
                 style="display: inline-block; padding: 12px 24px; background-color: #4F46E5;
                        color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Verify Email Address
              </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6B7280;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px;">
              If you didn't create an account with FairMediator, you can safely ignore this email.
            </p>
          </div>
        `
      });

      logger.info('Email verification sent', { email });
    } else {
      // Development mode - log to console
      console.log('\n=================================');
      console.log('📧 EMAIL VERIFICATION');
      console.log('=================================');
      console.log(`To: ${email}`);
      console.log(`Name: ${userName}`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log('=================================\n');

      logger.info('Email verification (dev mode)', { email, verificationUrl });
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
        subject: 'Welcome to FairMediator!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to FairMediator, ${userName}!</h2>
            <p>Your email has been verified successfully. You now have full access to your account.</p>
            <h3>What's next?</h3>
            <ul>
              <li>Search for mediators by location and specialty</li>
              <li>Check for potential conflicts of interest</li>
              <li>View bias indicators and political affiliations</li>
              <li>Get AI-powered recommendations</li>
            </ul>
            <p>
              <a href="${process.env.FRONTEND_URL}/dashboard"
                 style="display: inline-block; padding: 12px 24px; background-color: #4F46E5;
                        color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Go to Dashboard
              </a>
            </p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px;">
              Thank you for choosing FairMediator!
            </p>
          </div>
        `
      });

      logger.info('Welcome email sent', { email });
    } else {
      console.log(`\n📧 Welcome email would be sent to: ${email}\n`);
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

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail
};
