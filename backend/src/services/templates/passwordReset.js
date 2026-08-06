import { cardLayout } from "./shared/cardLayout.js";
import { otpBox, otpBoxCSS } from "./shared/components.js";
import { BRAND } from "./shared/theme.js";

/**
 * password reset OTP email template.
 */
export function passwordResetEmailTemplate({
  otpCode,
  expiryMinutes,
  userName,
}) {
  const subject = `${BRAND.name} - Password Reset`;

  const bodyHtml = `
    ${userName ? `<p class="greeting-lead">Hello <span class="user-name">${userName}</span>,</p>` : ""}
    <p class="lead-text">We received a request to reset your password. Use the following OTP to verify your identity:</p>
    ${otpBox(otpCode, expiryMinutes)}
    <p class="lead-text">If you didn't request a password reset, please ignore this email or contact support.</p>
    <div class="warning">⚠️ Never share this OTP with anyone</div>
  `;

  const html = cardLayout({
    eyebrow: "Password Reset",
    bodyHtml,
    footerNote: "This is an automated message. Please do not reply.",
    showLegalFooter: false,
    extraCSS: `
      ${otpBoxCSS}
      .greeting-lead { color: #666; margin: 0 0 14px; }
      .user-name { color: #333; font-weight: 600; }
      .lead-text { color: #666; margin: 0 0 14px; line-height: 1.5; }
      .warning { color: #b45309; font-size: 14px; margin-top: 20px; }
    `,
  });

  const text = `
${BRAND.name} - Password Reset

${userName ? `Hello ${userName},` : ""}

We received a request to reset your password. Your OTP code is: ${otpCode}
Expires in: ${expiryMinutes} minutes

If you didn't request a password reset, please ignore this email.
Never share this OTP with anyone.

${BRAND.name} - Emergency Alert System
This is an automated message. Please do not reply.
  `.trim();

  return { subject, html, text };
}
