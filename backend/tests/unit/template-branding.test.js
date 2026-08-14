import {
  LOGO_WIDTH,
  LOGO_HEIGHT,
} from "../../src/services/templates/shared/logo.js";
import { alertLayout } from "../../src/services/templates/shared/alertLayout.js";
import { cardLayout } from "../../src/services/templates/shared/cardLayout.js";

describe("Email template branding", () => {
  it("keeps the logo compact enough for both mobile and desktop email layouts", () => {
    expect(LOGO_WIDTH).toBeGreaterThan(0);
    expect(LOGO_HEIGHT).toBeGreaterThan(0);
    expect(LOGO_HEIGHT).toBeLessThanOrEqual(64);
    expect(LOGO_WIDTH / LOGO_HEIGHT).toBeGreaterThan(2);

    const alertHtml = alertLayout({
      headerBg: "#0d9488",
      headerIcon: "🚨",
      headerTitle: "Test alert",
      headerSubtitle: "Campus safety",
      pillLabel: "ACTIVE",
      pillBg: "#dc2626",
      pillText: "#ffffff",
      bodyHtml: "<p>Body content</p>",
      footerNote: "SafeWalk Campus",
    });

    const cardHtml = cardLayout({
      eyebrow: "WELCOME",
      bodyHtml: "<p>Body content</p>",
      footerNote: "SafeWalk Campus",
    });

    expect(alertHtml).toContain(`width: ${LOGO_WIDTH}px`);
    expect(cardHtml).toContain(`width: ${LOGO_WIDTH}px`);
  });
});
