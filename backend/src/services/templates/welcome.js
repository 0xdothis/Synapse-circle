import { cardLayout } from "./shared/cardLayout.js";
import { BRAND } from "./shared/theme.js";

/**
 * @param {object} params
 * @param {{name?: string, email: string}} params.user
 * @param {number} params.maxTrustedContacts
 * @param {string} params.appUrl
 */
export function welcomeEmailTemplate({
  user,
  maxTrustedContacts,
  appUrl = process.env.FRONTEND_URL,
}) {
  const subject = `🎉 Welcome to ${BRAND.name}!`;

  const features = [
    {
      icon: "🚨",
      title: "SOS Panic Button",
      text: "Instantly alert your trusted contacts and campus security with your live location",
    },
    {
      icon: "👥",
      title: "Trusted Contacts",
      text: `Add up to ${maxTrustedContacts} trusted contacts to receive your SOS alerts`,
    },
    {
      icon: "📍",
      title: "Live Location Sharing",
      text: "Share your real-time location during emergencies",
    },
    {
      icon: "🏥",
      title: "Emergency Directory",
      text: "Access campus security, hospitals, police, and other emergency contacts",
    },
  ];

  const featuresHtml = features
    .map(
      (f) => `
        <div class="feature-item">
          <div class="feature-icon">${f.icon}</div>
          <div class="feature-text"><h4>${f.title}</h4><p>${f.text}</p></div>
        </div>
      `,
    )
    .join("");

  const bodyHtml = `
    <div class="welcome-box">
      <h2>👋 Welcome ${user.name || user.email}!</h2>
      <p>Your campus safety journey begins now</p>
    </div>
    <h3 class="section-title">Here's what you can do:</h3>
    <div class="features">${featuresHtml}</div>
    <div class="next-steps">
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Complete your profile</li>
        <li>Add your trusted contacts</li>
        <li>Set up your university campus</li>
        <li>Enable location sharing</li>
      </ol>
    </div>
    <div class="cta-wrap"><a href="${appUrl}" class="cta-button">🚀 Go to App</a></div>
    <div class="tip-box"><p><strong>💡 Tip:</strong> Keep your app updated and ensure location services are enabled for the best experience.</p></div>
  `;

  const html = cardLayout({
    eyebrow: "Welcome",
    bodyHtml,
    maxWidth: "600px",
    showLegalFooter: false,
    footerNote: "This is an automated message. Please do not reply.",
    extraCSS: `
      .welcome-box { background-color: #f2f7f6; border: 1px solid #e3ede9; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
      .welcome-box h2 { margin: 0; font-size: 22px; color: ${BRAND.teal}; }
      .welcome-box p { color: #555; margin: 10px 0 0; }
      .section-title { color: #333; }
      .features { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .feature-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
      .feature-item:last-child { border-bottom: none; }
      .feature-icon { font-size: 24px; margin-right: 15px; width: 40px; text-align: center; }
      .feature-text { flex: 1; }
      .feature-text h4 { margin: 0; color: #333; }
      .feature-text p { margin: 5px 0 0; color: #666; font-size: 14px; }
      .next-steps { margin: 25px 0; }
      .next-steps p { color: #666; }
      .next-steps ol { color: #555; padding-left: 20px; }
      .cta-wrap { text-align: center; margin: 30px 0; }
      .cta-button { display: inline-block; background-color: ${BRAND.teal}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
      .tip-box { background: #f2f7f6; border-left: 4px solid ${BRAND.teal}; padding: 15px; border-radius: 4px; margin: 20px 0; color: ${BRAND.teal}; }
      @media only screen and (max-width: 480px) {
        .welcome-box { padding: 20px 15px; }
        .welcome-box h2 { font-size: 19px; }
        .features { padding: 14px; }
        .feature-icon { font-size: 20px; width: 32px; margin-right: 10px; }
        .cta-button { display: block; width: 100%; box-sizing: border-box; padding: 14px 20px; }
      }
    `,
  });

  const text = `
Welcome to ${BRAND.name}!

Hello ${user.name || user.email},

Your campus safety journey begins now! Here's what you can do:

${features.map((f, i) => `${i + 1}. ${f.title} - ${f.text}`).join("\n")}

Next Steps:
- Complete your profile
- Add your trusted contacts
- Set up your university campus
- Enable location sharing

💡 Tip: Keep your app updated and ensure location services are enabled for the best experience.

---
${BRAND.name} - Emergency Alert System
This is an automated message. Please do not reply.
Need help? Contact support: ${BRAND.supportEmail}
  `.trim();

  return { subject, html, text };
}
