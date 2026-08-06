import { alertLayout } from "../shared/alertLayout.js";
import {
  detailRow,
  detailsBox,
  mapImageBlock,
  actionButton,
} from "../shared/components.js";
import { STATUS_THEME, BRAND } from "../shared/theme.js";

/**
 * Sent to the user themselves right after they trigger an SOS alert,
 * confirming it went out and who it was sent to.
 */
export function sosConfirmationEmailTemplate({
  userName,
  userPhone,
  latitude,
  longitude,
  locationLink,
  alertId,
  timestamp,
  message,
  googleMapsApiKey,
}) {
  const theme = STATUS_THEME.active;
  const subject = "🚨 SOS Alert Confirmation - Help is on the way!";
  const locationUrl =
    locationLink ||
    (typeof latitude === "number" && typeof longitude === "number"
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null);

  const detailsRows =
    detailRow("Alert ID:", alertId) +
    detailRow("Time Sent:", timestamp || new Date().toLocaleString()) +
    (message ? detailRow("Your Message:", `"${message}"`) : "") +
    detailRow(
      "Coordinates:",
      latitude && longitude ? `${latitude}, ${longitude}` : null,
      { last: true },
    );

  const bodyHtml = `
    <div class="confirm-box">
      <span class="big-check">✅</span>
      <h3 class="confirm-title">Alert Sent Successfully</h3>
      <p class="confirm-sub">Your emergency contacts have been notified.</p>
    </div>

    <h4 class="section-heading">Alert Details</h4>
    ${detailsBox(null, detailsRows)}

    <h4 class="section-heading">Your Location</h4>
    ${mapImageBlock({ latitude, longitude, googleMapsApiKey })}
    ${locationUrl ? `<div style="text-align:center;">${actionButton(locationUrl, "📍 View on Google Maps", { bg: "#4CAF50" })}</div>` : ""}

    <h4 class="section-heading">Alert Sent To</h4>
    <div class="recipients-box">
      <div class="recipient-row"><strong>University Security</strong><span class="status-badge">✅ Notified</span></div>
      <div class="recipient-row"><strong>Emergency Directory</strong><span class="status-badge">✅ Notified</span></div>
      <div class="recipient-row"><strong>Your Trusted Contacts</strong><span class="status-badge">✅ Notified</span></div>
    </div>

    <div class="false-alarm-box">
      <p><strong>⚠️ False Alarm?</strong> If this was a mistake, you can cancel the alert from the app within 5 minutes.</p>
    </div>

    <div class="actions">
      ${userPhone ? actionButton(`tel:${userPhone}`, "📞 Call Emergency", { bg: "#4CAF50" }) : ""}
    </div>
  `;

  const html = alertLayout({
    headerBg: theme.headerBg,
    headerIcon: "🚨",
    headerTitle: "SOS Alert Sent",
    headerSubtitle: "Help is on the way! Your alert has been dispatched.",
    bodyHtml,
    extraCSS: `
      .section-heading { margin: 22px 0 8px; color: #333; font-size: 15px; }
      .confirm-box { background-color: #e8f5e9; border: 1px solid #c8e6c9; padding: 20px; border-radius: 8px; margin: 4px 0 20px; text-align: center; }
      .big-check { font-size: 44px; display: block; }
      .confirm-title { margin: 10px 0 5px; color: #2e7d32; }
      .confirm-sub { margin: 0; color: #555; }
      .recipients-box { background: #f8f9fa; padding: 4px 15px; border-radius: 8px; margin: 12px 0 20px; }
      .recipient-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
      .recipient-row:last-child { border-bottom: none; }
      .status-badge { display: inline-block; background: #4CAF50; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 12px; }
      .false-alarm-box { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px; margin: 20px 0; color: #856404; }
    `,
  });

  const text = `
🚨 SOS ALERT CONFIRMATION - Help is on the way!

Alert ID: ${alertId || "N/A"}
Time Sent: ${timestamp || new Date().toLocaleString()}
${message ? `Message: "${message}"` : ""}

Location: ${locationUrl || "Location not available"}

This alert has been sent to:
✅ University Security
✅ Emergency Directory
✅ Your Trusted Contacts

⚠️ False Alarm? If this was a mistake, you can cancel the alert from the app within 5 minutes.

---
${BRAND.name} - Emergency Alert System
This is an automated message. Please do not reply.
  `.trim();

  return { subject, html, text };
}
