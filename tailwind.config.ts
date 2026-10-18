import type { Config } from "tailwindcss";
export default { content: ["./src/**/*.{ts,tsx}"], theme: { extend: { colors: {
  navy: "#14213d", ivory: "#fbf6ea", paper: "#f1e8d2", emerald: { DEFAULT: "#0f9d6b" }, coral: "#f0734a",
  lav: "#b8a9f0", volt: "#2f5bff", danger: "#b3413f", ink: "#24262b" },
  fontFamily: { display: ["Georgia", "Cambria", "serif"], mono: ["ui-monospace", "Menlo", "monospace"] } } }, plugins: [] } satisfies Config;
