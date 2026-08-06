import { BRAND, RESPONSIVE_BREAKPOINT } from "./theme.js";
import { LOGO_BASE64_PNG, LOGO_WIDTH, LOGO_HEIGHT } from "./logo.js";
import {
  baseResetCSS,
  detailsBoxCSS,
  bulletBoxCSS,
  mapBlockCSS,
  recipientsCSS,
  actionButtonCSS,
  footerCSS,
  footer,
} from "./components.js";

/**
 * Full-width banner layout shared by every SOS notification email:
 * active alert (red), cancelled (dark), false alarm (amber), and the
 * confirmation sent back to the person who triggered the alert.
 */
export function alertLayout({
  headerBg,
  headerIcon,
  headerTitle,
  headerSubtitle,
  pillLabel,
  pillBg,
  pillText,
  bodyHtml,
  footerNote,
  extraCSS = "",
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${baseResetCSS}
        body { background-color: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; width: 100%; box-sizing: border-box; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .brand-row { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; color: ${BRAND.teal}; padding: 22px 20px 0; }
        .brand-row img.icon { width: ${LOGO_WIDTH}px; height: ${LOGO_HEIGHT}px; vertical-align: middle; }
        .header { background: ${headerBg}; color: #ffffff; padding: 26px 20px; text-align: center; margin-top: 18px; }
        .header h1 { margin: 0; font-size: 26px; }
        .header .sub { font-size: 15px; opacity: 0.92; margin-top: 8px; }
        .content { padding: 26px 20px; }
        .status-pill { display: inline-block; background: ${pillBg}; color: ${pillText}; font-weight: 700; font-size: 12px; letter-spacing: 0.4px; padding: 6px 14px; border-radius: 20px; margin-bottom: 18px; }
        .greeting { font-size: 16px; color: #222; }
        .lead { color: #555; font-size: 15px; line-height: 1.5; }
        .message-quote { background: #f2f7f6; border-left: 3px solid ${BRAND.teal}; padding: 14px 16px; margin: 16px 0 8px; border-radius: 6px; color: #333; font-style: italic; }
        .message-caption { font-size: 13px; color: #888; margin: 6px 0 0; }
        ${detailsBoxCSS}
        ${bulletBoxCSS}
        ${mapBlockCSS}
        ${recipientsCSS}
        ${actionButtonCSS}
        ${footerCSS}
        .actions { margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
        .actions .action-button, .actions .action-button-disabled { flex: 1; min-width: 160px; }

        @media only screen and (max-width: ${RESPONSIVE_BREAKPOINT}) {
          body { padding: 0; }
          .container { border-radius: 0; box-shadow: none; }
          .brand-row { padding: 16px 16px 0; }
          .header { padding: 20px 16px; margin-top: 12px; }
          .header h1 { font-size: 21px; }
          .content { padding: 20px 16px; }
          .actions { flex-direction: column; }
          .actions .action-button, .actions .action-button-disabled { min-width: 100%; box-sizing: border-box; }
        }
        ${extraCSS}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand-row"><img src="${LOGO_BASE64_PNG}" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" alt="${BRAND.name}" class="icon" /> ${BRAND.name}</div>
        <div class="header">
          <h1>${headerIcon} ${headerTitle}</h1>
          <div class="sub">${headerSubtitle}</div>
        </div>
        <div class="content">
          ${pillLabel ? `<span class="status-pill">${pillLabel}</span>` : ""}
          ${bodyHtml}
        </div>
        ${footer({ note: footerNote })}
      </div>
    </body>
    </html>
  `;
}
