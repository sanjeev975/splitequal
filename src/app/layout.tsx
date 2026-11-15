import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { AuthSync } from "@/components/AuthSync";
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" }); // self-hosted by Next at build time
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
export const metadata: Metadata = {
  title: "SplitLoL — Every expense. Fairly shared.", description: "Split trips, rent and bills fairly.",
  applicationName: "SplitLoL", manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "SplitLoL", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#faf5ff" }, { media: "(prefers-color-scheme: dark)", color: "#111827" }], width: "device-width", initialScale: 1, viewportFit: "cover" };
// Applies the saved Light/Dark choice before first paint so there is no flash. (No saved choice = follow the device.)
const THEME_INIT = `try{var t=localStorage.getItem("splitlol.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}><head><script dangerouslySetInnerHTML={{ __html: THEME_INIT }} /></head>
    <body className="min-h-screen">{children}<AuthSync /><PwaRegister /></body></html>);
}
