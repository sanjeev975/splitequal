"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { FeedbackForm } from "./FeedbackForm";

export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    (async () => {
      const { data: { user } } = await supabaseBrowser().auth.getUser();
      setAuthed(!!user);
    })();
    return () => {
      if (d && d.open) d.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialog.current) onClose(); }}
      className="fixed inset-0 z-50 m-0 min-h-screen w-full bg-bg/50 backdrop-blur-sm p-4 backdrop:bg-bg/50 outline-none"
    >
      <div className="mx-auto mt-20 max-w-md w-full">
        <div className="bg-card p-6 rounded-2xl shadow-xl border border-border">
          {authed === null ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : authed ? (
            <FeedbackForm onSuccess={onClose} />
          ) : (
            <div className="space-y-3">
              <h2 className="h-card">Send feedback</h2>
              <p className="text-sm text-muted">Please sign in to share your feedback, report bugs, or request features.</p>
              <Link href="/login" className="btn inline-block text-center w-full">Sign in to SplitLoL</Link>
            </div>
          )}
          <button onClick={onClose} className="mt-4 text-sm underline text-muted">Close</button>
        </div>
      </div>
    </dialog>
  );
}
