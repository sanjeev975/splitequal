export type RGB = [number, number, number];
const lum = ([r, g, b]: RGB) => { const t = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * t(r) + 0.7152 * t(g) + 0.0722 * t(b); };
export const ratio = (a: RGB, b: RGB) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const tokens = (block: string) => { const t: Record<string, RGB> = {}; for (const m of block.matchAll(/--([a-z0-9-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) t[m[1]] = [+m[2], +m[3], +m[4]]; return t; };
const grab = (css: string, from: number) => { if (from < 0) throw new Error("theme block not found in globals.css"); return css.slice(css.indexOf("{", from) + 1, css.indexOf("}", from)); };
export function themes(css: string) {
  const light = tokens(grab(css, css.indexOf(":root {")));
  const dark = tokens(grab(css, css.indexOf(':root[data-theme="dark"] {')));
  const mediaDark = tokens(grab(css, css.indexOf(':root:not([data-theme="light"]) {', css.indexOf("@media (prefers-color-scheme: dark)"))));
  return { light, dark, mediaDark };
}
// [text color, background, minimum ratio]. 4.5 = WCAG AA for normal text; 3 = large text and graphics (chart series).
export const PAIRS: [string, string, number][] = [
  ["fg", "bg", 4.5], ["fg", "card", 4.5], ["fg", "inset", 4.5], ["fg", "soft", 4.5],
  ["muted", "bg", 4.5], ["muted", "card", 4.5], ["muted", "inset", 4.5],
  ["on", "primary", 4.5], ["on", "accent", 4.5], ["on", "good", 4.5], ["on", "danger", 4.5],
  ["primary", "card", 4.5], ["accent", "card", 4.5], ["accent", "bg", 4.5], ["good", "card", 4.5], ["good", "bg", 4.5], ["danger", "card", 4.5], ["danger", "bg", 4.5], ["soft-fg", "soft", 4.5],
  ["chart-4", "card", 3], ["chart-5", "card", 3], ["chart-6", "card", 3], ["chart-7", "card", 3], ["chart-8", "card", 3],
];
