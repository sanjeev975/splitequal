"use client";
import Link from "next/link";
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (<div className="card mx-auto max-w-md space-y-3 text-center"><h1 className="font-display text-2xl font-bold">We couldn't load this page</h1>
    <p className="text-muted">This is usually a temporary connection problem. Your data is safe.</p>
    <div className="flex flex-wrap justify-center gap-2"><button className="btn" onClick={reset}>Try again</button><Link className="btn bg-inset text-fg" href="/dashboard">Go to dashboard</Link></div></div>);
}
