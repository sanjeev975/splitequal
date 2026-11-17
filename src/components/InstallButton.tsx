"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { isIOS, isStandalone } from "@/lib/pwa-utils";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallButton() {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Hide if already standalone (iOS or Android)
    if (isStandalone()) {
      setCanInstall(false);
      return;
    }

    // Hide on iOS (handled by IOSInstallBanner)
    if (isIOS()) {
      setCanInstall(false);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIP);
      setCanInstall(true);
    };

    const onInstalled = () => {
      setCanInstall(false);
      try { localStorage.setItem("pwa-installed", "1"); } catch {}
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!canInstall || !evt) return null;

  return (
    <button
      className="btn btn-sm !rounded-full !px-3"
      onClick={async () => {
        if (!evt) return;
        await evt.prompt();
        const choice = await evt.userChoice;
        if (choice.outcome === "accepted") {
          setCanInstall(false);
          try { localStorage.setItem("pwa-installed", "1"); } catch {}
        }
        setEvt(null);
      }}
    >
      <Download size={14} className="mr-1" />Install
    </button>
  );
}
