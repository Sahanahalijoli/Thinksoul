import nodemailer from 'nodemailer'

/**
 * AWS SES Transporter Configuration
 * Uses environment variables for secure SMTP connection.
 */
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  });
}

/**
 * Generic Email Sender
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();
  
  // Verify connection
  try {
    await transporter.verify();
  } catch (err) {
    console.error('SMTP Verification Error:', err);
    throw new Error('Email service unavailable.');
  }

  return await transporter.sendMail({
    from: `"ThinkSoul Team" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

/**
 * Template: Password Reset
 */
export function generateResetEmailHTML(resetUrl: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1f1f1f 0%,#37352f 100%);padding:40px 40px 32px;text-align:center;">
              <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.15);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:24px;font-weight:800;color:#ffffff;">T</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Reset Password
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#37352f;line-height:1.6;">
                We received a request to reset your ThinkSoul account password.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#5f6368;line-height:1.6;">
                Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" 
                       style="display:inline-block;padding:14px 36px;background:#1f1f1f;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
                This link will expire in 2 hours. If the button doesn't work, copy and paste this link:<br/>
                <a href="${resetUrl}" style="color:#1a73e8;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">
                &copy; ${new Date().getFullYear()} ThinkSoul Co. — Security Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Template: Invitation
 */
export function generateInviteEmailHTML(inviteUrl: string, workspaceName: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1f1f1f 0%,#37352f 100%);padding:40px 40px 32px;text-align:center;">
              <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.15);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:24px;font-weight:800;color:#ffffff;">T</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                You're Invited!
              </h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.65);font-weight:500;">
                ThinkSoul Workspace Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#37352f;line-height:1.6;">
                You've been invited to join the workspace <strong style="color:#1f1f1f;">"${workspaceName}"</strong> on ThinkSoul.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#5f6368;line-height:1.6;">
                Click the button below to create your account and get started.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" 
                       style="display:inline-block;padding:14px 36px;background:#1f1f1f;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
                      Accept & Register →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${inviteUrl}" style="color:#1a73e8;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">
                &copy; ${new Date().getFullYear()} ThinkSoul Co. — Built for Founders
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
