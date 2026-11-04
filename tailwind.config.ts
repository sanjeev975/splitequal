import type { Config } from "tailwindcss";
const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`; // colors live in globals.css as CSS variables so light/dark can swap them
export default { content: ["./src/**/*.{ts,tsx}"], theme: { extend: {
  colors: { bg: v("bg"), card: v("card"), fg: v("fg"), muted: v("muted"), primary: v("primary"), on: v("on"), accent: v("accent"), good: v("good"), danger: v("danger"),
    border: v("border"), inset: v("inset"), soft: v("soft"), "soft-fg": v("soft-fg"), ring: v("ring"),
    ivory: v("bg"), paper: v("card"), navy: v("primary"), coral: v("accent"), emerald: v("good"), lav: v("soft"), volt: v("primary"), ink: v("fg") }, // legacy names still work
  fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], display: ["var(--font-sans)", "system-ui", "sans-serif"], mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"] },
  borderRadius: { "2xl": "1rem" },
  fontSize: { xs: ["0.8rem", "1.1rem"], sm: ["0.875rem", "1.25rem"], base: ["1rem", "1.45rem"], lg: ["1.0625rem", "1.5rem"], xl: ["1.125rem", "1.5rem"],
    "2xl": ["1.3rem", "1.7rem"], "3xl": ["1.5rem", "1.9rem"], "4xl": ["1.9rem", "2.2rem"], "5xl": ["2.4rem", "1.1"] } } }, plugins: [] } satisfies Config;
