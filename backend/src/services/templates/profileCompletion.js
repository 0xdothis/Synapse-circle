import { cardLayout } from "./shared/cardLayout.js";
import { BRAND } from "./shared/theme.js";

/**
 * profile completion email template.
 */
export function profileCompletionEmailTemplate({ user }) {
  const subject = "✅ Profile Complete - You're Ready to Go!";

  const checklist = [
    {
      title: "University Selected",
      text: user.selectedUniversity || "Your university has been linked",
    },
    {
      title: "Trusted Contacts Added",
      text: "Your trusted contacts are ready to receive alerts",
    },
    {
      title: "Location Permission Enabled",
      text: "Your location can be shared during emergencies",
    },
  ];

  const checklistHtml = checklist
    .map(
      (c) => `
        <div class="checklist-item">
          <div class="check-icon">✅</div>
          <div class="checklist-text"><h4>${c.title}</h4><p>${c.text}</p></div>
        </div>
      `,
    )
    .join("");

  const bodyHtml = `
    <div class="success-box"><h2>✅ Profile Complete!</h2><p>Your safety setup is ready. You can now use ${BRAND.name}.</p></div>
    <h3 class="section-title">What's been set up:</h3>
    <div class="checklist">${checklistHtml}</div>
    <div class="tip-box"><p><strong>💡 Tip:</strong> You can always update your profile and contacts from the app settings.</p></div>
    <div class="cta-wrap"><a href="#" class="cta-button">🚀 Open ${BRAND.name}</a></div>
  `;

  const html = cardLayout({
    eyebrow: "Profile Complete",
    bodyHtml,
    maxWidth: "600px",
    showLegalFooter: false,
    footerNote: "This is an automated message. Please do not reply.",
    extraCSS: `
      .success-box { background-color: #e8f5e9; border: 1px solid #c8e6c9; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
      .success-box h2 { margin: 0; font-size: 22px; color: #2e7d32; }
      .success-box p { color: #555; margin-top: 8px; }
      .section-title { color: #333; }
      .checklist { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .checklist-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
      .checklist-item:last-child { border-bottom: none; }
      .check-icon { color: #2e7d32; font-size: 20px; margin-right: 15px; }
      .checklist-text { flex: 1; }
      .checklist-text h4 { margin: 0; color: #333; }
      .checklist-text p { margin: 4px 0 0; color: #666; font-size: 14px; }
      .tip-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; color: #856404; }
      .cta-wrap { text-align: center; margin: 30px 0; }
      .cta-button { display: inline-block; background-color: ${BRAND.teal}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
      @media only screen and (max-width: 480px) {
        .success-box { padding: 20px 15px; }
        .success-box h2 { font-size: 19px; }
        .checklist { padding: 14px; }
        .cta-button { display: block; width: 100%; box-sizing: border-box; padding: 14px 20px; }
      }
    `,
  });

  const text = `
✅ Profile Complete - You're Ready to Go!

Your safety setup is ready. You can now use ${BRAND.name}.

What's been set up:
${checklist.map((c) => `✅ ${c.title} - ${c.text}`).join("\n")}

💡 Tip: You can always update your profile and contacts from the app settings.

---
${BRAND.name} - Emergency Alert System
This is an automated message. Please do not reply.
Need help? Contact support: ${BRAND.supportEmail}
  `.trim();

  return { subject, html, text };
}
