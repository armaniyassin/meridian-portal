import type { Config } from "tailwindcss";

// Colors point at the CSS variables in globals.css, so light/dark switch without extra classes.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", surface: "var(--surface)", surface2: "var(--surface2)", line: "var(--line)",
        text: "var(--text)", muted: "var(--muted)", accent: "var(--accent)", up: "var(--up)", down: "var(--down)", upt: "var(--upT)", downt: "var(--downT)",
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], mono: ["var(--font-mono)", "ui-monospace", "monospace"] },
    },
  },
  plugins: [],
};
export default config;
