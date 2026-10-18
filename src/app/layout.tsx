import "./globals.css";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/PwaRegister";
export const metadata: Metadata = {
  title: "Splitequal — Every expense. Fairly shared.", description: "Split trips, rent and bills fairly.",
  applicationName: "Splitequal", manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Splitequal", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#14213d", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="min-h-screen">{children}<PwaRegister /></body></html>;
}
