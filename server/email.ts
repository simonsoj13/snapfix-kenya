let resendClient: InstanceType<typeof import("resend").Resend> | null = null;

function getResendClient() {
  if (!resendClient) {
    const { Resend } = require("resend");
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendVerificationCode(email: string, code: string, name: string) {
  await getResendClient().emails.send({
    from: "Snap-Fix Kenya <onboarding@resend.dev>",
    to: email,
    subject: "Your Snap-Fix Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #10b981;">Snap-Fix Kenya</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #10b981; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>— Snap-Fix Kenya Team</p>
      </div>
    `,
  });
}

export async function sendPasswordResetCode(email: string, code: string) {
  await getResendClient().emails.send({
    from: "Snap-Fix Kenya <onboarding@resend.dev>",
    to: email,
    subject: "Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #10b981;">Snap-Fix Kenya</h2>
        <p>Your password reset code is:</p>
        <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #10b981; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>— Snap-Fix Kenya Team</p>
      </div>
    `,
  });
}
