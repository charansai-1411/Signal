import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        border: "var(--border)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        accent: "var(--accent)",
        "status-open": "var(--status-open)",
        "status-blocked": "var(--status-blocked)",
        "status-resolved": "var(--status-resolved)",
        "status-contra": "var(--status-contra)",
        "contra-tint": "var(--contra-tint)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        h1: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        h2: ["1.5rem", { lineHeight: "1.2" }],
        "card-title": ["1.25rem", { lineHeight: "1.3" }],
        label: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.04em" }],
        source: ["0.875rem", { lineHeight: "1.5" }],
      },
      maxWidth: {
        content: "760px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,23,18,0.04)",
      },
      borderRadius: {
        card: "12px",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
