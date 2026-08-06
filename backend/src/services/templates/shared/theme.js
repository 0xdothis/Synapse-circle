/**
 * Shared design tokens for all SafeWalk Campus email templates.
 * Keeping these in one place means a brand refresh is a one-file change,
 * instead of hunting through every template.
 */

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

export const BRAND = {
  name: "SafeWalk Campus",
  teal: "#0d7377",
  tealDark: "#0a5b5e",
  tealTint: "#f2f7f6",
  tealBorder: "#e3ede9",
  supportEmail: "support@safewalk-campus.com",
};

export const STATUS_THEME = {
  active: {
    headerBg: "#ff4444",
    accent: "#ff4444",
    accentDark: "#c62828",
    pillBg: "#ffebee",
    pillText: "#c62828",
    boxBg: "#ffebee",
    boxText: "#c62828",
    buttonBg: "#2196F3",
  },
  cancelled: {
    headerBg: "#0a1f1d",
    accent: "#0d7377",
    accentDark: "#0a5b5e",
    pillBg: "#e8f5e9",
    pillText: "#2e7d32",
    boxBg: "#e8f5e9",
    boxText: "#2e7d32",
    buttonBg: "#0d7377",
  },
  false_alarm: {
    headerBg: "#9c6f0b",
    accent: "#9c6f0b",
    accentDark: "#7a5808",
    pillBg: "#fdf3e0",
    pillText: "#8a5a00",
    boxBg: "#fbf2df",
    boxText: "#8a5a00",
    buttonBg: "#9c9c9c",
  },
};

export const RESPONSIVE_BREAKPOINT = "480px";
