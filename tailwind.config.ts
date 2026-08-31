import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Federal institutional palette
        navy: {
          50: "#f0f4f9",
          100: "#d9e2ef",
          200: "#b3c5df",
          300: "#7d9cc4",
          400: "#4a6fa3",
          500: "#2b4d80",
          600: "#1d3a66",
          700: "#162d52",
          800: "#0f2142",
          900: "#0a1834",
          950: "#050d1f",
        },
        federal: {
          blue: "#0a1834",
          accent: "#b31942",
          gold: "#b8860b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
