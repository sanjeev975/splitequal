"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
export const PRESETS = [{ id: "1", e: "🦊", bg: "#f0734a" }, { id: "2", e: "🐼", bg: "#b8a9f0" }, { id: "3", e: "🐯", bg: "#f2b84b" }, { id: "4", e: "🦉", bg: "#2f5bff" },
  { id: "5", e: "🐙", bg: "#0f9d6b" }, { id: "6", e: "🦄", bg: "#e58ac3" }, { id: "7", e: "🐢", bg: "#4aa89a" }, { id: "8", e: "🦁", bg: "#d98c3f" }];
const cache = new Map<string, { url: string; exp: number }>();
export function Avatar({ path, name, size = 36 }: { path?: string | null; name: string; size?: number }) {
  const [url, setUrl] = useState<string | null>(() => {
    if (!path || path.startsWith("preset:")) return null;
    const hit = cache.get(path);
    return hit && hit.exp > Date.now() ? hit.url : null;
  });
  const [loading, setLoading] = useState(() => {
    if (!path || path.startsWith("preset:")) return false;
    const hit = cache.get(path);
    return !(hit && hit.exp > Date.now());
  });

  useEffect(() => {
    let off = false;
    if (!path || path.startsWith("preset:")) {
      setUrl(null);
      setLoading(false);
      return;
    }
    const hit = cache.get(path);
    if (hit && hit.exp > Date.now()) {
      setUrl(hit.url);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabaseBrowser().storage.from("avatars").createSignedUrl(path, 3600).then(({ data }) => {
      if (data && !off) {
        cache.set(path, { url: data.signedUrl, exp: Date.now() + 3_300_000 });
        setUrl(data.signedUrl);
      }
      setLoading(false);
    });
    return () => { off = true; };
  }, [path]);

  const box = { width: size, height: size, fontSize: size * 0.5, lineHeight: 1 };
  const preset = path?.startsWith("preset:") ? PRESETS.find((p) => p.id === path.slice(7)) : undefined;
  if (preset) return <span aria-hidden className="inline-grid shrink-0 place-items-center rounded-full" style={{ ...box, background: preset.bg }}>{preset.e}</span>;

  const initial = <span aria-hidden className="inline-grid shrink-0 place-items-center rounded-full bg-primary font-bold text-on" style={{ ...box, fontSize: size * 0.42 }}>{(name.trim()[0] ?? "?").toUpperCase()}</span>;

  // We show the image if we have a URL, otherwise the initial.
  // To avoid the flash of the initial state, we don't render the initial if we know we are loading a real image.
  return (
    <span className="relative inline-grid shrink-0 rounded-full overflow-hidden" style={box}>
      {!url && initial}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      )}
    </span>
  );
}
