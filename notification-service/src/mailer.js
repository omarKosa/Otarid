const nodemailer = require("nodemailer");

// ─── Transporter ──────────────────────────────────────────────
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ─── Verify connection on startup ─────────────────────────────
transporter.verify((err) => {
  if (err) {
    console.error("[Mailer] SMTP connection failed:", err.message);
  } else {
    console.log("[Mailer] SMTP connection ready.");
  }
});

// ─── Templates ────────────────────────────────────────────────
const templates = {
  "user.registered": (data) => ({
    subject: `Welcome ${data.name}`,
    html: `
      <h2>Hey ${data.name}, welcome aboard!</h2>
      <p>Your account has been created successfully.</p>
      <p>Email: <strong>${data.email}</strong></p>
      <br/>
      <p>Get started by visiting your profile.</p>
    `,
  }),

  "password.reset": (data) => ({
    subject: "Reset your password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${data.name || "there"},</p>
      <p>Click the link below to reset your password. This link expires in <strong>10 minutes</strong>.</p>
      <p>
        <a href="${data.resetUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #4F46E5;
          color: white;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
        ">Reset Password</a>
      </p>
      <p>If you didn't request this, ignore this email — your password won't change.</p>
    `,
  }),
};

// ─── Send ──────────────────────────────────────────────────────
const sendEmail = async (eventName, data) => {
  const template = templates[eventName];

  if (!template) {
    console.warn(`[Mailer] No template found for event: ${eventName}`);
    return;
  }

  if (!data.email) {
    console.error(`[Mailer] No email address in event data for: ${eventName}`);
    return;
  }

  const { subject, html } = template(data);

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@yourapp.com",
    to: data.email,
    subject,
    html,
  });

  console.log(`[Mailer] Email sent to ${data.email} | subject: "${subject}" | message_id: ${info.messageId}`);
};

module.exports = { sendEmail };
