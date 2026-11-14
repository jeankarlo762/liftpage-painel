import type { Config } from "tailwindcss";

// Cores da marca LiftPage (preto, branco e azul midnight). Fonte da verdade: src/app/tokens.css.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF1FB",
          100: "#DCE2F7",
          300: "#9DB0FF", // midnight claro
          500: "#2B3F8F",
          600: "#1A2A6C", // midnight
          700: "#111A3D", // midnight escuro
        },
        ink: { 900: "#0A0A0B", 700: "#2A2E3A", 500: "#4B5163", 300: "#A3A8B8" },
        gelo: "#F5F6F9",
        linha: "#E2E5EC",
      },
      fontFamily: {
        sans: ["var(--lc-font-body)"],
        display: ["var(--lc-font-display)"],
        mono: ["var(--lc-font-mono)"],
      },
    },
  },
  plugins: [],
} satisfies Config;
