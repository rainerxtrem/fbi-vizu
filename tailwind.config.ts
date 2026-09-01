import type { Config } from "tailwindcss";

/**
 * The `navy` scale and `white` resolve to CSS custom properties (see
 * globals.css). In light mode they hold the federal palette; the `.dark` class
 * on <html> swaps every value so the whole app flips theme without any
 * component needing `dark:` variants. Convention across the codebase:
 *   low navy numbers = "paper", high numbers = "ink", and that mapping inverts
 *   in dark mode.
 *
 * Colours that must stay constant in both themes are literal:
 *   - `federal.*` (institutional blue / accent red / gold)
 *   - `on-accent` (text on the accent red)
 */
const navy = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((k) => [
    k,
    `rgb(var(--n-${k}) / <alpha-value>)`,
  ]),
);

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "rgb(var(--c-white) / <alpha-value>)",
        navy,
        "on-accent": "#ffffff",
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
