import { cardLayout } from "./shared/cardLayout.js";
import { BRAND } from "./shared/theme.js";

export function onboardingCompleteEmailTemplate() {
  const subject = `🎉 You're Ready to Go! - ${BRAND.name}`;

  const features = [
    {
      icon: "🚨",
      title: "Trigger SOS Alerts",
      text: "Instantly alert your trusted contacts and campus security",
    },
    {
      icon: "📍",
      title: "Share Live Location",
      text: "Your location is shared automatically during emergencies",
    },
    {
      icon: "🏥",
      title: "Access Emergency Directory",
      text: "Quick access to campus security, hospitals, and police",
    },
  ];

  const featuresHtml = features
    .map(
      (f) => `
        <div class="feature-item">
          <span class="feature-icon">${f.icon}</span>
          <div><h4>${f.title}</h4><p>${f.text}</p></div>
        </div>
      `,
    )
    .join("");

  const bodyHtml = `
    <div class="complete-box"><h2>🎉 Setup Complete!</h2><p>You're all set to use ${BRAND.name}</p></div>
    <h3 class="section-title">You can now:</h3>
    <div class="features">${featuresHtml}</div>
    <p class="closing">Stay safe! The ${BRAND.name} team is here for you.</p>
  `;

  const html = cardLayout({
    eyebrow: "Setup Complete",
    bodyHtml,
    maxWidth: "600px",
    showLegalFooter: false,
    footerNote: "This is an automated message. Please do not reply.",
    extraCSS: `
      .complete-box { background-color: #f2f7f6; border: 1px solid #e3ede9; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
      .complete-box h2 { margin: 0; font-size: 22px; color: ${BRAND.teal}; }
      .complete-box p { color: #555; margin-top: 8px; }
      .section-title { color: #333; }
      .features { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .feature-item { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
      .feature-item:last-child { border-bottom: none; }
      .feature-icon { font-size: 24px; margin-right: 15px; }
      .feature-item h4 { margin: 0; color: #333; }
      .feature-item p { margin: 5px 0 0; color: #666; font-size: 14px; }
      .closing { color: #666; margin: 25px 0; }
      @media only screen and (max-width: 480px) {
        .complete-box { padding: 20px 15px; }
        .complete-box h2 { font-size: 19px; }
        .features { padding: 14px; }
      }
    `,
  });

  const text = `
✅ Setup Complete!

You're all set to use ${BRAND.name}!

You can now:
${features.map((f, i) => `${i + 1}. ${f.title} - ${f.text}`).join("\n")}

Stay safe! The ${BRAND.name} team is here for you.

---
${BRAND.name} - Emergency Alert System
This is an automated message. Please do not reply.
  `.trim();

  return { subject, html, text };
}
