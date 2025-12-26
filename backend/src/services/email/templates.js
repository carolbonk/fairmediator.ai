/**
 * Email Templates
 * Professional HTML email templates for all user communications
 */

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
`;

const buttonStyles = `
  display: inline-block;
  padding: 14px 28px;
  background-color: #4F46E5;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  margin: 24px 0;
  font-weight: 600;
  text-align: center;
`;

/**
 * Email verification template
 */
const verificationEmail = (userName, verificationUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - FairMediator</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #F3F4F6;">
      <div style="${baseStyles}; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">FairMediator</h1>
          <p style="color: #6B7280; margin: 8px 0 0 0;">Transparent Mediator Selection Platform</p>
        </div>

        <h2 style="color: #111827; margin: 0 0 16px 0;">Welcome, ${userName}!</h2>

        <p style="color: #374151; line-height: 1.6; margin: 16px 0;">
          Thank you for registering with FairMediator. To complete your account setup and access all features,
          please verify your email address by clicking the button below.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" style="${buttonStyles}">
            Verify Email Address
          </a>
        </div>

        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 16px 0;">
          Or copy and paste this link into your browser:
        </p>
        <p style="word-break: break-all; color: #4F46E5; font-size: 14px; margin: 8px 0;">
          ${verificationUrl}
        </p>

        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400E; font-size: 14px;">
            <strong>⏱️ This link expires in 24 hours.</strong> If you don't verify within this time,
            you'll need to request a new verification email.
          </p>
        </div>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #E5E7EB;">

        <p style="color: #6B7280; font-size: 13px; line-height: 1.6; margin: 16px 0;">
          If you didn't create an account with FairMediator, you can safely ignore this email.
          No account will be created without email verification.
        </p>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0;">
            © ${new Date().getFullYear()} FairMediator. All rights reserved.
          </p>
          <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0;">
            Questions? Contact us at support@fairmediator.com
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Welcome email template (after verification)
 */
const welcomeEmail = (userName, dashboardUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to FairMediator!</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #F3F4F6;">
      <div style="${baseStyles}; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">🎉 Welcome to FairMediator!</h1>
        </div>

        <h2 style="color: #111827; margin: 0 0 16px 0;">Hi ${userName},</h2>

        <p style="color: #374151; line-height: 1.6; margin: 16px 0;">
          Your email has been verified successfully! You now have full access to FairMediator's platform
          for transparent and unbiased mediator selection.
        </p>

        <h3 style="color: #111827; margin: 24px 0 12px 0;">What You Can Do Now:</h3>

        <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
          <li><strong>Search Mediators</strong> by location, specialty, and experience</li>
          <li><strong>Check for Conflicts</strong> with our AI-powered conflict detection</li>
          <li><strong>View Bias Indicators</strong> including political affiliations and past cases</li>
          <li><strong>Get AI Recommendations</strong> tailored to your specific case</li>
          <li><strong>Export Reports</strong> for your records and decision-making</li>
        </ul>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}" style="${buttonStyles}">
            Go to Dashboard
          </a>
        </div>

        <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #1E40AF; font-weight: 600;">
            💡 Pro Tip:
          </p>
          <p style="margin: 0; color: #1E3A8A; font-size: 14px; line-height: 1.6;">
            Start by searching for mediators in your jurisdiction, then use our conflict checker
            to ensure impartiality. Our AI assistant can guide you through the entire process.
          </p>
        </div>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #E5E7EB;">

        <h3 style="color: #111827; margin: 24px 0 12px 0;">Need Help?</h3>
        <p style="color: #374151; line-height: 1.6; margin: 0;">
          Our support team is here to assist you:
        </p>
        <ul style="color: #374151; line-height: 1.6; padding-left: 20px; margin: 8px 0;">
          <li>📧 Email: <a href="mailto:support@fairmediator.com" style="color: #4F46E5;">support@fairmediator.com</a></li>
          <li>📚 Documentation: <a href="${process.env.FRONTEND_URL}/docs" style="color: #4F46E5;">User Guide</a></li>
          <li>💬 Chat: Live chat available in your dashboard</li>
        </ul>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0;">
            © ${new Date().getFullYear()} FairMediator. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Password reset template
 */
const passwordResetEmail = (userName, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - FairMediator</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #F3F4F6;">
      <div style="${baseStyles}; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">FairMediator</h1>
        </div>

        <h2 style="color: #111827; margin: 0 0 16px 0;">Password Reset Request</h2>

        <p style="color: #374151; line-height: 1.6; margin: 16px 0;">
          Hi ${userName},
        </p>

        <p style="color: #374151; line-height: 1.6; margin: 16px 0;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="${buttonStyles}">
            Reset Password
          </a>
        </div>

        <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 16px 0;">
          Or copy and paste this link:
        </p>
        <p style="word-break: break-all; color: #4F46E5; font-size: 14px;">
          ${resetUrl}
        </p>

        <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; color: #991B1B; font-size: 14px; line-height: 1.6;">
            <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request
            this password reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #E5E7EB;">

        <p style="color: #6B7280; font-size: 13px; line-height: 1.6; margin: 0;">
          If you're having trouble clicking the button, copy and paste the URL above into your web browser.
        </p>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0;">
            © ${new Date().getFullYear()} FairMediator. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Account lockout notification
 */
const accountLockedEmail = (userName, lockDuration) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Locked - FairMediator</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #F3F4F6;">
      <div style="${baseStyles}; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #DC2626; margin: 0; font-size: 28px;">🔒 Account Locked</h1>
        </div>

        <h2 style="color: #111827; margin: 0 0 16px 0;">Hi ${userName},</h2>

        <p style="color: #374151; line-height: 1.6; margin: 16px 0;">
          Your FairMediator account has been temporarily locked due to multiple failed login attempts.
        </p>

        <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #991B1B; font-weight: 600;">
            Security Information:
          </p>
          <p style="margin: 0; color: #991B1B; font-size: 14px; line-height: 1.6;">
            Your account will automatically unlock in <strong>${lockDuration} minutes</strong>.
            After that, you can try logging in again.
          </p>
        </div>

        <p style="color: #374151; line-height: 1.6; margin: 16px 0;">
          If you didn't attempt to log in, someone may be trying to access your account.
          We recommend changing your password once the lock expires.
        </p>

        <h3 style="color: #111827; margin: 24px 0 12px 0;">What You Can Do:</h3>
        <ul style="color: #374151; line-height: 1.8; padding-left: 20px;">
          <li>Wait ${lockDuration} minutes for automatic unlock</li>
          <li>Change your password after unlocking</li>
          <li>Contact support if you suspect unauthorized access</li>
        </ul>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0;">
            Need help? Contact <a href="mailto:security@fairmediator.com" style="color: #4F46E5;">security@fairmediator.com</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  verificationEmail,
  welcomeEmail,
  passwordResetEmail,
  accountLockedEmail
};
