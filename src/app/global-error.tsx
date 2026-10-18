"use client";
import { useEffect } from "react";
// Last-resort error screen (replaces the whole page if the root layout itself crashes). Error trackers such as Sentry hook in here too.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (<html lang="en"><body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#fbf6ea", color: "#24262b", fontFamily: "Georgia, serif", textAlign: "center", padding: 24 }}>
    <main><h1 style={{ color: "#14213d" }}>Something went wrong</h1><p>Please try again. If it keeps happening, contact support{error.digest ? ` and quote reference ${error.digest}` : ""}.</p>
      <button onClick={reset} style={{ border: 0, borderRadius: 12, padding: "10px 18px", color: "#fff", background: "#14213d", font: "600 16px Georgia, serif", cursor: "pointer" }}>Try again</button></main></body></html>);
}
