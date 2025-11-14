const axios = require('axios');

/**
 * Email Service using Resend API
 * FREE tier: 3,000 emails/month, 100 emails/day
 * https://resend.com/docs/send-with-nodejs
 */

class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@fairmediator.com';
    this.apiUrl = 'https://api.resend.com/emails';
    this.enabled = !!this.apiKey;

    if (!this.enabled) {
      console.warn('⚠️  RESEND_API_KEY not set. Email functionality disabled.');
    }
  }

  /**
   * Send email using Resend API
   * @private
   * @param {Object} emailData - { to, subject, html, text }
   * @returns {Promise<Object>} Resend API response
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.enabled) {
      console.log(`📧 Email would be sent to ${to}: ${subject}`);
      return { id: 'test-email-id', status: 'skipped' };
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          from: this.fromEmail,
          to: [to],
          subject,
          html,
          text: text || this.stripHtml(html),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ Email sent to ${to}: ${subject}`);
      return response.data;
    } catch (error) {
      console.error('❌ Email send error:', error.response?.data || error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send verification email
   * @param {string} email - User's email
   * @param {string} token - Verification token
   * @param {string} name - User's name
   * @returns {Promise<Object>}
   */
  async sendVerificationEmail(email, token, name) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f7f9fc; padding: 40px 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .button:hover { background: #5568d3; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to FairMediator!</h1>
          </div>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>Thank you for registering with FairMediator. Please verify your email address to get started.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with FairMediator, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FairMediator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify your FairMediator account',
      html,
    });
  }

  /**
   * Send password reset email
   * @param {string} email - User's email
   * @param {string} token - Reset token
   * @param {string} name - User's name
   * @returns {Promise<Object>}
   */
  async sendPasswordResetEmail(email, token, name) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f7f9fc; padding: 40px 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 14px 28px; background: #f5576c; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .button:hover { background: #e04758; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>We received a request to reset your FairMediator account password.</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Note:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and ensure your account is secure.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FairMediator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset your FairMediator password',
      html,
    });
  }

  /**
   * Send welcome email (after email verification)
   * @param {string} email - User's email
   * @param {string} name - User's name
   * @returns {Promise<Object>}
   */
  async sendWelcomeEmail(email, name) {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f7f9fc; padding: 40px 30px; border-radius: 0 0 8px 8px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; }
          .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to FairMediator!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your account is now verified and ready to use! Here's what you can do with your free account:</p>

            <div class="feature">
              <strong>🔍 5 Mediator Searches/Day</strong><br>
              Find mediators using natural language queries
            </div>

            <div class="feature">
              <strong>👥 View 10 Profiles/Day</strong><br>
              Browse detailed mediator profiles and ratings
            </div>

            <div class="feature">
              <strong>🤖 AI-Powered Conflict Detection</strong><br>
              Automatic flagging of potential conflicts of interest
            </div>

            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Start Searching</a>
            </p>

            <p><strong>Want more?</strong> Upgrade to Premium for unlimited searches, advanced filters, export functionality, and more!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FairMediator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to FairMediator - Your account is ready!',
      html,
    });
  }

  /**
   * Send subscription upgrade confirmation
   * @param {string} email - User's email
   * @param {string} name - User's name
   * @param {string} tier - Subscription tier (premium/enterprise)
   * @returns {Promise<Object>}
   */
  async sendUpgradeConfirmation(email, name, tier) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #f7f9fc; padding: 40px 30px; border-radius: 0 0 8px 8px; }
          .badge { display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white; border-radius: 20px; font-weight: 600; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${tier.charAt(0).toUpperCase() + tier.slice(1)}!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your subscription has been upgraded successfully!</p>
            <div style="text-align: center; margin: 30px 0;">
              <span class="badge">${tier.toUpperCase()} MEMBER</span>
            </div>
            <p><strong>Your new benefits:</strong></p>
            <ul>
              <li>✅ Unlimited mediator searches</li>
              <li>✅ Unlimited profile views</li>
              <li>✅ Advanced filtering options</li>
              <li>✅ Export to PDF/CSV</li>
              <li>✅ Saved searches with email alerts</li>
              <li>✅ Private chat history</li>
              <li>✅ Priority support</li>
            </ul>
            <p>Thank you for upgrading! We're excited to help you find the perfect mediator.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} FairMediator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Welcome to FairMediator ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`,
      html,
    });
  }

  /**
   * Strip HTML tags from string (for plain text fallback)
   * @private
   * @param {string} html
   * @returns {string}
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

module.exports = new EmailService();
