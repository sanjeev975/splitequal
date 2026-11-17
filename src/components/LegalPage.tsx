"use client";
import { useState } from "react";
import { FeedbackModal } from "./FeedbackModal";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LEGAL, hasPlaceholders } from "@/lib/legal";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export type Section = [string, ...(string | string[])[]]; // [heading, paragraph | bullet list, ...]
export function LegalPage({ title, sections }: { title: string; sections: Section[] }) {
  const [show, setShow] = useState(false);
  const router = useRouter();
  async function openFeedback() {
    const { data: { user } } = await supabaseBrowser().auth.getUser();
    if (!user) { router.push("/login"); return; }
    setShow(true);
  }
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <Link href="/"><Logo /></Link>
      <header>
        <h1 className="font-display text-4xl font-bold text-navy">{title}</h1>
        <p className="text-sm opacity-70">Last updated: {LEGAL.updated}</p>
      </header>
      {hasPlaceholders() && <p role="alert" className="rounded-xl bg-danger p-3 text-sm text-on">DRAFT: placeholders in src/lib/legal.ts are not filled in yet. Do not launch with this banner showing.</p>}
      {sections.map(([h, ...blocks], i) => (
        <section key={h} className="space-y-2">
          <h2 className="h-card">{i + 1}. {h}</h2>
          {blocks.map((b, j) => (typeof b === "string" ? <p key={j}>{b}</p> : <ul key={j} className="list-disc space-y-1 pl-5">{b.map((x) => <li key={x}>{x}</li>)}</ul>))}
        </section>
      ))}
      <p className="text-sm">
        <Link className="underline" href="/privacy">Privacy Policy</Link> · <Link className="underline" href="/terms">Terms of Service</Link> · <button className="underline" onClick={openFeedback}>Feedback</button> · <Link className="underline" href="/">Home</Link>
      </p>
      <LegalFooter />
      {show && <FeedbackModal onClose={() => setShow(false)} />}
    </main>
  );
}

export function LegalFooter() {
  const [show, setShow] = useState(false);
  const router = useRouter();
  async function openFeedback() {
    const { data: { user } } = await supabaseBrowser().auth.getUser();
    if (!user) { router.push("/login"); return; }
    setShow(true);
  }
  return (
    <>
      <footer className="py-6 text-center text-sm opacity-80">
        <Link className="underline" href="/privacy">Privacy</Link> · <Link className="underline" href="/terms">Terms</Link> · <button className="underline" onClick={openFeedback}>Feedback</button> · {LEGAL.email}
      </footer>
      {show && <FeedbackModal onClose={() => setShow(false)} />}
    </>
  );
}
