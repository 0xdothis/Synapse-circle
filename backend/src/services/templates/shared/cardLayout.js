import { BRAND, RESPONSIVE_BREAKPOINT } from "./theme.js";
import { baseResetCSS, footerCSS, footer } from "./components.js";
import { LOGO_BASE64_PNG, LOGO_WIDTH, LOGO_HEIGHT } from "./logo.js";

/**
 * The rounded "card on a light background" layout used for account-style
 * emails (OTP codes, welcome, password reset, onboarding/profile
 * completion). Matches the SafeWalk Campus verification-code design.
 */
export function cardLayout({
  eyebrow,
  bodyHtml,
  footerNote,
  showLegalFooter = true,
  extraCSS = "",
  maxWidth = "500px",
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${baseResetCSS}
        body { background-color: #f4f6f5; padding: 20px; }
        .container { max-width: ${maxWidth}; width: 100%; box-sizing: border-box; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
        .header { display: flex; align-items: center; justify-content: center; margin-bottom: 30px; }
        .brand { display: flex; align-items: center; justify-content: center; width: 100%; }
        .brand img.icon { width: ${LOGO_WIDTH}px; height: auto; max-width: 100%; display: block; margin: 0 auto; }
        .eyebrow { color: #9aa1a0; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; }
        ${footerCSS}
        .footer { border-top: 1px solid #eef1f0; background: transparent; padding: 20px 0 0; margin-top: 30px; text-align: left; }

        @media only screen and (max-width: ${RESPONSIVE_BREAKPOINT}) {
          body { padding: 12px; }
          .container { padding: 24px 20px; border-radius: 8px; }
          .header { flex-wrap: wrap; row-gap: 8px; }
          .brand { font-size: 16px; }
          .eyebrow { font-size: 10px; }
        }
        ${extraCSS}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand"><img src="${LOGO_BASE64_PNG}" width="${LOGO_WIDTH}" height="${LOGO_HEIGHT}" alt="${BRAND.name}" class="icon" /></div>
          ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
        </div>
        ${bodyHtml}
        ${footer({ note: footerNote, showLegal: showLegalFooter, supportEmail: showLegalFooter ? undefined : BRAND.supportEmail })}
      </div>
    </body>
    </html>
  `;
}
