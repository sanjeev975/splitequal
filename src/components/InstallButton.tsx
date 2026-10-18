"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export function InstallButton() {
  const [evt, setEvt] = useState<BIP | null>(null); const [ios, setIos] = useState(false); const [hint, setHint] = useState(false); const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) { setInstalled(true); return; }
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIP); }; const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt); window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  if (installed) return null;
  if (evt) return <button className="btn !py-1 !px-3 text-sm" onClick={async () => { await evt.prompt(); await evt.userChoice; setEvt(null); }}><Download size={16} className="inline mr-1" />Install app</button>;
  if (ios) return (<><button className="btn !py-1 !px-3 text-sm" onClick={() => setHint(!hint)}><Download size={16} className="inline mr-1" />Install</button>
    {hint && <p role="status" className="card fixed bottom-4 left-4 right-4 z-50 text-sm">On iPhone/iPad: tap the Share button in Safari, then “Add to Home Screen”.</p>}</>);
  return null;
}
