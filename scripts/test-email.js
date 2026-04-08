/**
 * Test Email Sending
 * Run: node scripts/test-email.js
 */

require('dotenv').config({ path: './backend/.env' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('🧪 Testing email configuration...\n');

  console.log('✓ Resend API Key:', process.env.RESEND_API_KEY ? 'Found' : '❌ Missing');
  console.log('✓ From Email:', process.env.RESEND_FROM_EMAIL || 'noreply@fairmediator.ai');
  console.log('✓ Reply-To:', process.env.EMAIL_REPLY_TO || 'contact@fairmediator.ai');
  console.log('');

  // Test email recipient
  const testRecipient = 'carolainebonk@gmail.com';

  try {
    console.log(`📧 Sending test email to: ${testRecipient}...`);

    const { data, error } = await resend.emails.send({
      from: `FairMediator <${process.env.RESEND_FROM_EMAIL || 'noreply@fairmediator.ai'}>`,
      replyTo: process.env.EMAIL_REPLY_TO || 'contact@fairmediator.ai',
      to: [testRecipient],
      subject: 'FairMediator Email Test',
      html: `
        <h2>✅ Email Configuration Test</h2>
        <p>This email was sent from your FairMediator backend using Resend.</p>
        <hr>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>From: ${process.env.RESEND_FROM_EMAIL || 'noreply@fairmediator.ai'}</li>
          <li>Reply-To: ${process.env.EMAIL_REPLY_TO || 'contact@fairmediator.ai'}</li>
          <li>Support: ${process.env.EMAIL_SUPPORT || 'support@fairmediator.ai'}</li>
          <li>Partnerships: ${process.env.EMAIL_PARTNERSHIPS || 'partnerships@fairmediator.ai'}</li>
        </ul>
        <p>If you received this email, your email system is working correctly!</p>
      `
    });

    if (error) {
      console.error('❌ Error:', error);

      if (error.message && error.message.includes('domain')) {
        console.log('\n💡 Next Steps:');
        console.log('1. Add fairmediator.ai domain in Resend dashboard');
        console.log('2. Add DNS records (SPF, DKIM) to IONOS');
        console.log('3. Wait 15-30 min for DNS propagation');
        console.log('4. Verify domain in Resend');
        console.log('5. Run this test again');
      }

      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📬 Email ID:', data.id);
    console.log('\n✓ Check your inbox:', testRecipient);
    console.log('✓ If not received, check spam folder');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testEmail();
