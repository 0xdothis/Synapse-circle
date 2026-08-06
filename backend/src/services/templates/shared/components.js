import { FONT_STACK, RESPONSIVE_BREAKPOINT } from "./theme.js";

/**
 * A single "label / value" row used inside an Alert Details box.
 * Desktop: label left, value right. Mobile: stacked (handled by CSS).
 */
export function detailRow(label, value, { last = false } = {}) {
  if (value === undefined || value === null || value === "") return "";
  return `
    <div class="detail-row"${last ? ' style="border-bottom:none;"' : ""}>
      <span class="detail-label">${label}</span>
      <span class="detail-value">${value}</span>
    </div>
  `;
}

/**
 * Wraps a set of detail rows in the light-gray "Alert Details" box seen
 * across all SOS-style templates.
 */
export function detailsBox(title, rowsHtml) {
  return `
    <div class="details-box">
      ${title ? `<h3 class="details-title">${title}</h3>` : ""}
      ${rowsHtml}
    </div>
  `;
}

/**
 * Colored callout box used for "Immediate Actions Required",
 * "Current Status", and "What This Means" sections.
 */
export function bulletBox({ title, items, ordered = false, boxBg, boxText }) {
  const tag = ordered ? "ol" : "ul";
  const itemsHtml = items.map((item) => `<li>${item}</li>`).join("");
  return `
    <div class="bullet-box" style="background:${boxBg}; color:${boxText};">
      <strong class="bullet-box-title" style="color:${boxText};">${title}</strong>
      <${tag} class="bullet-box-list">${itemsHtml}</${tag}>
    </div>
  `;
}

/**
 * Renders a static map image (Google Static Maps API) when an API key is
 * configured and coordinates are available. Falls back to a neutral
 * placeholder panel otherwise, so the email never shows a broken image.
 *
 * `overlay`, when provided, renders a centered callout card on top of the
 * map (used by the false-alarm template to show "tracking has ended").
 */
export function mapImageBlock({
  latitude,
  longitude,
  googleMapsApiKey,
  zoom = 15,
  width = 600,
  height = 260,
  overlay,
}) {
  const hasCoords =
    latitude !== undefined &&
    latitude !== null &&
    longitude !== undefined &&
    longitude !== null;

  if (!hasCoords) {
    return `
      <div class="map-block map-block-empty">
        <p class="map-empty-text">⚠️ Location could not be determined</p>
      </div>
    `;
  }

  const staticMapUrl = googleMapsApiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&scale=2&markers=color:red%7C${latitude},${longitude}&key=${googleMapsApiKey}`
    : null;

  const imageOrPlaceholder = staticMapUrl
    ? `<img src="${staticMapUrl}" width="${width}" height="${height}" alt="Map showing last known location" class="map-image" />`
    : `<div class="map-image map-image-placeholder"></div>`;

  return `
    <div class="map-block">
      ${imageOrPlaceholder}
      ${overlay ? `<div class="map-overlay">${overlay}</div>` : ""}
    </div>
  `;
}

/**
 * "This Alert Was Sent To" recipients list.
 */
export function recipientsList(contacts = []) {
  const rows = contacts
    .map(
      (c) => `
        <div class="recipient-row">
          <strong>${c.name || "Unknown"}</strong>
          <span class="recipient-type">${c.relationship || c.type || "Contact"}</span>
        </div>
      `,
    )
    .join("");

  return `
    <h4 class="recipients-title">This Alert Was Sent To</h4>
    <div class="recipients-box">${rows}</div>
  `;
}

export function actionButton(url, label, { bg, disabled = false } = {}) {
  if (disabled) {
    return `<span class="action-button action-button-disabled">${label}</span>`;
  }
  return `<a href="${url}" target="_blank" class="action-button" style="background:${bg};">${label}</a>`;
}

export function footer({ note, showLegal = false, supportEmail } = {}) {
  return `
    <div class="footer">
      <p class="footer-team"><strong>The SafeWalk Campus Team</strong></p>
      <p class="footer-note">${note || "This is an automated message from SafeWalk Campus. Please do not reply directly to this email."}</p>
      ${supportEmail ? `<p class="footer-support">Need help? Contact support: ${supportEmail}</p>` : ""}
      ${
        showLegal
          ? `<div class="footer-legal">
              <span>© ${new Date().getFullYear()} SafeWalk Campus Inc.</span>
              <span><a href="#">Privacy Policy</a> &nbsp; <a href="#">Terms of Service</a></span>
            </div>`
          : ""
      }
    </div>
  `;
}

/**
 * The large letter-spaced OTP code box used by both signup/login OTP
 * emails and the password-reset OTP email.
 */
export function otpBox(otpCode, expiryMinutes) {
  return `
    <div class="otp-box">
      <div class="otp-code">${otpCode}</div>
      <div class="expiry-text">This code will expire in ${expiryMinutes} minutes.</div>
    </div>
  `;
}

export const otpBoxCSS = `
  .otp-box { background-color: #f2f7f6; border: 1px solid #e3ede9; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
  .otp-code { font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1a1a1a; font-family: 'Courier New', monospace; }
  .expiry-text { color: #0d7377; font-size: 13px; font-weight: 600; margin-top: 14px; }
  @media only screen and (max-width: 480px) {
    .otp-box { padding: 20px 12px; }
    .otp-code { font-size: 30px; letter-spacing: 6px; }
  }
`;

// Shared CSS fragments reused verbatim by every template's <style> block.
export const baseResetCSS = `
  body { font-family: ${FONT_STACK}; margin: 0; }
  a { color: inherit; }
`;

export const detailsBoxCSS = `
  .details-box { background: #f8f9fa; border-radius: 8px; padding: 15px 18px; margin: 20px 0; }
  .details-title { margin: 0 0 10px; font-size: 15px; color: #333; }
  .detail-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e6e6e6; gap: 12px; }
  .detail-label { color: #666; font-size: 14px; }
  .detail-value { color: #1a1a1a; font-size: 14px; font-weight: 600; text-align: right; }
  @media only screen and (max-width: ${RESPONSIVE_BREAKPOINT}) {
    .detail-row { flex-direction: column; align-items: flex-start; gap: 2px; }
    .detail-value { text-align: left; }
  }
`;

export const bulletBoxCSS = `
  .bullet-box { border-radius: 8px; padding: 16px 18px; margin: 20px 0; }
  .bullet-box-title { display: block; margin-bottom: 8px; font-size: 14px; }
  .bullet-box-list { margin: 0; padding-left: 20px; }
  .bullet-box-list li { margin: 6px 0; font-size: 14px; line-height: 1.4; }
`;

export const mapBlockCSS = `
  .map-block { position: relative; border-radius: 8px; overflow: hidden; margin: 12px 0 16px; }
  .map-image { display: block; width: 100%; height: auto; }
  .map-image-placeholder { width: 100%; padding-top: 43%; background: #e6e6e6; }
  .map-block-empty { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; }
  .map-empty-text { color: #ff9800; margin: 0; }
  .map-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 84%; background: rgba(255,255,255,0.97); border-radius: 10px; padding: 16px 18px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.12); }
`;

export const recipientsCSS = `
  .recipients-title { margin: 24px 0 10px; font-size: 15px; color: #333; }
  .recipients-box { background: #f5f5f5; border-radius: 8px; padding: 4px 15px; }
  .recipient-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; gap: 12px; }
  .recipient-row:last-child { border-bottom: none; }
  .recipient-type { color: #666; font-size: 13px; }
`;

export const actionButtonCSS = `
  .action-button { display: inline-block; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; color: #ffffff; text-align: center; }
  .action-button-disabled { display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: bold; color: #888; background: #e0e0e0; text-align: center; cursor: default; }
`;

export const footerCSS = `
  .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #e0e0e0; margin-top: 10px; }
  .footer-team { margin: 0 0 4px; color: #444; }
  .footer-note { margin: 0; }
  .footer-support { margin: 10px 0 0; color: #999; }
  .footer-legal { margin-top: 14px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; color: #999; }
  .footer-legal a { color: #666; text-decoration: none; }
`;
