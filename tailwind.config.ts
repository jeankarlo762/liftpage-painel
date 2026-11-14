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
          500: "#2B3F8F", // hover dos botões
          600: "#1A2A6C", // midnight
          700: "#111A3D", // midnight escuro
        },
        // Painel sempre no modo escuro: "ink" é o texto (claro) e "gelo" o fundo (preto).
        ink: { 900: "#F5F6F9", 700: "#D3D7E2", 500: "#9AA0B3", 300: "#686E82" },
        gelo: "#0A0A0B",
        surface: "#131418",
        linha: "#262830",
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
