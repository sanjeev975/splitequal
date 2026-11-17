"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallButton() {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    const isStored = localStorage.getItem("pwa-installed") === "1";
    if (isStandalone || isStored) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    setIos(isIos);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIP);
    };

    const onInstalled = () => {
      setInstalled(true);
      localStorage.setItem("pwa-installed", "1");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Show if: (Not installed) AND (Native prompt exists OR on iOS)
  if (installed) return null;
  if (!evt && !ios) return null;

  return (
    <>
      <button className="btn btn-sm !rounded-full !px-3" onClick={async () => {
        if (evt) {
          try {
            await evt.prompt();
            const choice = await evt.userChoice;
            if (choice.outcome === 'accepted') setInstalled(true);
            setEvt(null);
          } catch {
            setHint(!hint);
          }
        } else {
          setHint(!hint);
        }
      }}>
        <Download size={14} className="mr-1" />Install
      </button>
      {hint && (
        <div role="status" className="card fixed bottom-20 left-4 right-4 z-50 text-sm space-y-2 max-w-sm mx-auto">
          <p className="font-semibold">How to install SplitLoL:</p>
          {ios ? (
            <p>To install, open this page in <b>Safari</b>, tap the <b>Share</b> button, then select <b>“Add to Home Screen”</b>.</p>
          ) : (
            <p>Tap your browser menu (three dots <b>⋮</b>), then select <b>“Install app”</b> or <b>“Add to Home screen”</b>.</p>
          )}
          <button onClick={() => setHint(false)} className="text-xs underline text-muted block pt-1">Got it</button>
        </div>
      )}
    </>
  );
}
