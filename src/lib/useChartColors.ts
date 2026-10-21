import { useEffect, useState } from "react";
// Charts draw with SVG, so they need real color values. Read them from the CSS variables and refresh when light/dark changes.
const rgb = (s: CSSStyleDeclaration, k: string) => `rgb(${s.getPropertyValue(`--${k}`).trim().split(/\s+/).join(" ")})`;
function read() {
  const s = getComputedStyle(document.documentElement);
  return { series: ["primary", "accent", "good", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"].map((k) => rgb(s, k)),
    grid: rgb(s, "border"), text: rgb(s, "fg"), muted: rgb(s, "muted"), card: rgb(s, "card"), primary: rgb(s, "primary"), accent: rgb(s, "accent"), good: rgb(s, "good") };
}
export function useChartColors() {
  const [c, setC] = useState<ReturnType<typeof read> | null>(null);
  useEffect(() => {
    const update = () => setC(read()); update();
    const mq = matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener("change", update);
    const mo = new MutationObserver(update); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { mq.removeEventListener("change", update); mo.disconnect(); };
  }, []);
  return c;
}
