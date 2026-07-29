// Magic-code (OTP) email branding for admin sign-in.
// Deploy with: npx instant-cli@latest auth email push
//
// Variables: {code} (required), {app_title}, {user_email}, {expiration}

const email = {
  authEmail: {
    subject: '{code} is your sign-in code for AI Girlfriend Expert',
    senderName: 'AI Girlfriend Expert',
    body: `<div style="background: #f6f6f6; font-family: Helvetica, Arial, sans-serif; line-height: 1.6; font-size: 16px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; padding: 24px;">
    <p style="margin: 0 0 12px; font-size: 18px;"><strong>AI Girlfriend Expert</strong></p>
    <p style="margin: 0 0 12px;">Hi {user_email},</p>
    <p style="margin: 0 0 16px;">Use this one-time code to sign in to the admin panel:</p>
    <p style="margin: 0 0 16px; text-align: center; font-size: 28px; letter-spacing: 4px;"><strong>{code}</strong></p>
    <p style="margin: 0; color: #666; font-size: 14px;">This code expires in {expiration} and can only be used once. If you did not request it, you can ignore this email.</p>
  </div>
</div>`,
  },
};

export default email;
