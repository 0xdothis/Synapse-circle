import { cardLayout } from "./shared/cardLayout.js";
import { otpBox, otpBoxCSS } from "./shared/components.js";
import { BRAND } from "./shared/theme.js";

/**
 * Signup / general verification OTP email.
 */
export function otpEmailTemplate({
  otpCode,
  expiryMinutes,
  purpose = "signup",
}) {
  const isSignup = purpose === "signup";
  const subject = isSignup
    ? `${BRAND.name}: Security Verification Code`
    : `${BRAND.name} - Your Verification Code`;

  const bodyHtml = `
    <p class="greeting-lead">Hi there,</p>
    <p class="lead-text">To complete your account registration and secure your profile, please verify your email address by using the 6-digit verification code below:</p>
    ${otpBox(otpCode, expiryMinutes)}
    <p class="lead-text">If you did not request this, you can safely ignore this email.</p>
    <p class="lead-text">Need help? Contact us at <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a></p>
  `;

  const html = cardLayout({
    eyebrow: isSignup ? "Security Verification" : "Verification Code",
    bodyHtml,
    footerNote: "Automated message. Please do not reply.",
    showLegalFooter: true,
    extraCSS: `
      ${otpBoxCSS}
      .greeting-lead { font-weight: 700; color: #222; margin: 0 0 14px; }
      .lead-text { color: #666; margin: 0 0 14px; line-height: 1.5; }
    `,
  });

  const text = `
${BRAND.name} - ${isSignup ? "Email Verification" : "Verification Code"}

Hi there,

To complete your account registration and secure your profile, please verify your email address using the code below:

Your OTP code is: ${otpCode}
Expires in: ${expiryMinutes} minutes

If you did not request this, you can safely ignore this email.
Never share this OTP with anyone.
Need help? Contact us at ${BRAND.supportEmail}

${BRAND.name} - Emergency Alert System
This is an automated message. Please do not reply.
  `.trim();

  return { subject, html, text };
}
