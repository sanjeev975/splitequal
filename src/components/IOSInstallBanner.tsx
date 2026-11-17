"use client";
import { useState, useEffect } from "react";
import { isIOS, isStandalone, isInAppBrowser } from "@/lib/pwa-utils";

export function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("ios-install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    if (isIOS() && !isStandalone()) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const inApp = isInAppBrowser();
  const text = inApp
    ? "Open this page in Safari (⋯ menu → Open in Safari), then add it to your Home Screen."
    : "Install SplitLoL: tap the Share icon, then Add to Home Screen.";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg flex items-center gap-3">
      <img src="/icons/icon-192.png" alt="App Icon" className="w-10 h-10 rounded-xl" />
      <p className="text-sm flex-1">{text}</p>
      <button
        onClick={() => {
          setShow(false);
          localStorage.setItem("ios-install-dismissed", Date.now().toString());
        }}
        className="text-muted p-2"
      >✕</button>
    </div>
  );
}
