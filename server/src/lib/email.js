import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || 'Heartly <onboarding@resend.dev>';

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY missing — email not sent');
    console.log('[email] Would send reset link to', to, ':', resetUrl);
    return { skipped: true };
  }

  const html = `
  <div style="font-family: Inter, -apple-system, sans-serif; background:#0b0b0f; padding:40px 20px; color:#fff;">
    <div style="max-width:480px; margin:0 auto; background:#16161c; border-radius:20px; padding:32px; border:1px solid rgba(255,255,255,0.08);">
      <div style="text-align:center; margin-bottom:24px;">
        <span style="font-size:22px; font-weight:800; letter-spacing:-0.3px; color:#fff;">
          <span style="color:#FF3B5C;">♥</span> Heartly
        </span>
      </div>

      <h1 style="font-size:24px; font-weight:800; margin:0 0 12px; color:#fff;">
        Reset your password
      </h1>

      <p style="font-size:14px; line-height:1.6; color:#9a9aa6; margin:0 0 24px;">
        Hi ${name || 'there'}, we received a request to reset your Heartly password.
        Click the button below to set a new one. This link expires in 30 minutes.
      </p>

      <a href="${resetUrl}"
         style="display:inline-block; background:#FF3B5C; color:#fff; text-decoration:none;
                padding:14px 28px; border-radius:12px; font-size:15px; font-weight:700;">
        Reset Password
      </a>

      <p style="font-size:12px; line-height:1.6; color:#6b6b78; margin:24px 0 0;">
        If you didn't request this, you can ignore this email. Your password won't change.
      </p>

      <p style="font-size:11px; color:#3d3d47; margin:24px 0 0; word-break:break-all;">
        Or copy this link: ${resetUrl}
      </p>
    </div>
  </div>
  `;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: 'Reset your Heartly password',
    html,
  });

  if (error) throw new Error(error.message || 'Email send failed');
  return data;
}
