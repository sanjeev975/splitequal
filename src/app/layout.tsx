import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" }); // self-hosted by Next at build time
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
export const metadata: Metadata = {
  title: "Splitequal — Every expense. Fairly shared.", description: "Split trips, rent and bills fairly.",
  applicationName: "Splitequal", manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Splitequal", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f6f8fb" }, { media: "(prefers-color-scheme: dark)", color: "#171717" }], width: "device-width", initialScale: 1, viewportFit: "cover" };
// Applies the saved Light/Dark choice before first paint so there is no flash. (No saved choice = follow the device.)
const THEME_INIT = `try{var t=localStorage.getItem("splitequal.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
export default function Root({ children }: { children: React.ReactNode }) {
  return (<html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}><head><script dangerouslySetInnerHTML={{ __html: THEME_INIT }} /></head>
    <body className="min-h-screen">{children}<PwaRegister /></body></html>);
}
