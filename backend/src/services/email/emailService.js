/**
 * Email Service using Resend
 * FREE: 3000 emails/month, no credit card required
 * Get API key at: https://resend.com/api-keys
 */

const { monitor } = require('../../utils/freeTierMonitor');

// Check if Resend is configured
const isEmailEnabled = () => {
  const key = process.env.RESEND_API_KEY;
  return !!(key && key !== 'your_resend_api_key_here' && key.length > 10);
};

let resend = null;
if (isEmailEnabled()) {
  const { Resend } = require('resend');
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend email service enabled');
} else {
  console.log('ℹ️  Email service not configured - Password reset emails will be logged only');
}

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, resetUrl, userName) => {
  if (!isEmailEnabled()) {
    console.log('📧 [DEV MODE] Password reset email would be sent to:', to);
    console.log('   Reset URL:', resetUrl);
    console.log('   User:', userName);
    return { success: true, dev: true };
  }

  // Track email usage for free tier monitoring
  const allowed = monitor.track('resend');
  if (!allowed) {
    console.log('❌ Email daily limit reached');
    return { success: false, error: 'Email daily limit reached. Try again tomorrow.' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FairMediator <noreply@fairmediator.com>',
      to: [to],
      subject: 'Reset Your FairMediator Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Reset Your Password</h1>
              </div>
              <div class="content">
                <p>Hi ${userName || 'there'},</p>
                <p>We received a request to reset your password for your FairMediator account.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <p>Best regards,<br>The FairMediator Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} FairMediator. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    console.log('✅ Password reset email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (to, userName) => {
  if (!isEmailEnabled()) {
    console.log('📧 [DEV MODE] Welcome email would be sent to:', to);
    return { success: true, dev: true };
  }

  // Track email usage for free tier monitoring
  const allowed = monitor.track('resend');
  if (!allowed) {
    console.log('❌ Email daily limit reached');
    return { success: false, error: 'Email daily limit reached. Try again tomorrow.' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FairMediator <noreply@fairmediator.com>',
      to: [to],
      subject: 'Welcome to FairMediator!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .feature { margin: 15px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to FairMediator!</h1>
              </div>
              <div class="content">
                <p>Hi ${userName},</p>
                <p>Thanks for joining FairMediator! We're excited to help you find the perfect mediator for your case.</p>
                
                <h3>What you can do now:</h3>
                <div class="feature">✓ Search our database of verified mediators</div>
                <div class="feature">✓ Check for conflicts of interest</div>
                <div class="feature">✓ Analyze mediator ideologies</div>
                <div class="feature">✓ Compare multiple mediators</div>
                
                <p><strong>Your Free Tier includes:</strong></p>
                <ul>
                  <li>5 searches per day</li>
                  <li>10 profile views per day</li>
                  <li>20 AI queries per day</li>
                </ul>
                
                <p>Want unlimited access? <a href="${process.env.FRONTEND_URL}/upgrade">Upgrade to Premium</a> for just $9.99/month!</p>
                
                <p>Best regards,<br>The FairMediator Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} FairMediator. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  isEmailEnabled,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
