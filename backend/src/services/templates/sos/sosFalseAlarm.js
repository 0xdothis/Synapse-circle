import { alertLayout } from "../shared/alertLayout.js";
import {
  detailRow,
  detailsBox,
  bulletBox,
  mapImageBlock,
  recipientsList,
  actionButton,
} from "../shared/components.js";
import { STATUS_THEME, BRAND } from "../shared/theme.js";

/**
 * Sent when an SOS alert has been reviewed and confirmed as an accidental
 * trigger / false alarm. Location tracking has already ended by this
 * point, so the map shows a "tracking has ended" overlay instead of a
 * live-location button.
 */
export function sosFalseAlarmEmailTemplate({
  recipientName,
  userName,
  userPhone,
  userEmail,
  latitude,
  longitude,
  locationLabel,
  contacts = [],
  alertId,
  timeTriggered,
  timeMarkedFalseAlarm,
  googleMapsApiKey,
}) {
  const theme = STATUS_THEME.false_alarm;
  const displayName = userName || userPhone || "A user";
  const subject = `⚠️ SOS False Alarm Reported by ${displayName}`;

  const detailsRows =
    detailRow("Time Triggered:", timeTriggered) +
    detailRow("Time Marked False Alarm:", timeMarkedFalseAlarm) +
    detailRow(
      "Location at Trigger:",
      locationLabel ? `📍 ${locationLabel}` : null,
    ) +
    detailRow("Phone:", userPhone) +
    detailRow("Email:", userEmail, { last: true });

  const overlayHtml = `
    <p class="overlay-title">📍 ${locationLabel || "Last known location"}</p>
    <p class="overlay-text">Location tracking has ended — no live data available.</p>
  `;

  const bodyHtml = `
    <p class="greeting">Hi ${recipientName || "there"},</p>
    <p class="lead">${displayName}'s recent SOS alert has been confirmed as a false alarm. The alert was most likely an accidental trigger and no emergency took place. There is no indication ${displayName} was in danger and you do not need to take any action.</p>

    ${bulletBox({
      title: "What This Means:",
      boxBg: theme.boxBg,
      boxText: theme.boxText,
      items: [
        `No emergency occurred — ${displayName} accidentally triggered the SOS alert.`,
        `${displayName} has confirmed they are safe and no assistance is needed.`,
        "Live location tracking has been disabled to protect their privacy.",
        "Campus Security has also been notified that this was a false alarm and has closed the case.",
        "No further action is required on your part.",
      ],
    })}

    <h4 class="section-heading">Alert Details</h4>
    ${detailsBox(null, detailsRows)}

    <h4 class="section-heading">Location at Time of Trigger</h4>
    ${mapImageBlock({ latitude, longitude, googleMapsApiKey, overlay: overlayHtml })}
    <div style="text-align:center;">${actionButton("#", "Location Tracking Disabled", { disabled: true })}</div>

    ${recipientsList(contacts)}

    <h4 class="section-heading">All clear — no action needed.</h4>
    <p class="lead">You can disregard the earlier alert. However, if you were already en route or had concerns, we recommend sending ${displayName} a quick message to confirm everything is fine.</p>
  `;

  const html = alertLayout({
    headerBg: theme.headerBg,
    headerIcon: "⚠️",
    headerTitle: "FALSE ALARM",
    headerSubtitle:
      "This alert has been reviewed and confirmed as a false alarm",
    pillLabel: "FALSE ALARM CONFIRMED",
    pillBg: theme.pillBg,
    pillText: theme.pillText,
    bodyHtml,
    extraCSS: `
      .section-heading { margin: 22px 0 8px; color: #333; font-size: 15px; }
      .overlay-title { margin: 0 0 4px; font-weight: 700; color: ${theme.boxText}; }
      .overlay-text { margin: 0; font-size: 13px; color: ${theme.boxText}; }
    `,
  });

  const text = `
⚠️ FALSE ALARM
This alert has been reviewed and confirmed as a false alarm

Hi ${recipientName || "there"},

${displayName}'s recent SOS alert has been confirmed as a false alarm. No emergency took place and no action is needed.

Time Triggered: ${timeTriggered || "N/A"}
Time Marked False Alarm: ${timeMarkedFalseAlarm || "N/A"}
${locationLabel ? `Location at Trigger: ${locationLabel}` : ""}
${userPhone ? `Phone: ${userPhone}` : ""}
${userEmail ? `Email: ${userEmail}` : ""}

Location tracking has ended — no live data available.

This alert was sent to:
${contacts.map((c) => `- ${c.name} (${c.relationship || c.type || "Contact"})`).join("\n")}

All clear — no action needed. You can disregard the earlier alert.

---
${BRAND.name} - Emergency Alert System
Alert ID: ${alertId || "N/A"}
This is an automated message. Please do not reply.
  `.trim();

  return { subject, html, text };
}
