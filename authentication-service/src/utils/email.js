const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: `"Auth Service" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click the button below — it expires in <strong>10 minutes</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:bold;">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#666;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="font-size:12px;color:#999;">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  });
};

const sendWelcomeEmail = async ({ to, name }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Auth Service" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Welcome! Your account is ready.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${name}! 🎉</h2>
        <p>Your account has been created successfully. You can now log in and manage your profile.</p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
