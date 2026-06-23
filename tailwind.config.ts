import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // StartFest / Silicon Slopes palette (sampled from the official agenda art)
        navy: {
          900: "#071a45",
          800: "#0a2461",
          700: "#0e2f87",
          600: "#123aa6",
        },
        teal: {
          glow: "#16c0d4",
        },
        lime: {
          DEFAULT: "#c6f23e",
          bright: "#d6fb4f",
          deep: "#a9d62b",
        },
        // Track colors
        track: {
          ai: "#c6f23e",
          marketing: "#19c9b6",
          operations: "#4fb8f0",
          funding: "#8b7bf0",
          leadership: "#c06af0",
          sales: "#ec5b9e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(7,26,69,0.06), 0 8px 24px -12px rgba(7,26,69,0.25)",
        glow: "0 0 0 1px rgba(198,242,62,0.4), 0 0 28px -6px rgba(198,242,62,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out",
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
