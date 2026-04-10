import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          500: "#2a64f6",
          600: "#1d4fd8",
          700: "#1d3fb9"
        },
        ink: "#121826",
        muted: "#6b7280",
        line: "#e8edf7",
        panel: "#ffffff",
        surface: "#f5f7fb",
        success: "#14b86a",
        warn: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        panel: "0 18px 48px rgba(31, 64, 133, 0.08)",
        soft: "0 10px 30px rgba(42, 100, 246, 0.08)"
      },
      borderRadius: {
        xl2: "28px"
      }
    }
  },
  plugins: []
} satisfies Config;

