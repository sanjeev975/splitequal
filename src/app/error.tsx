"use client";
export default function Err({ reset }: { error: Error; reset: () => void }) {
  return <main className="mx-auto max-w-md px-5 py-20 text-center"><h1 className="font-display text-3xl font-bold">Something went wrong</h1><button className="btn mt-6" onClick={reset}>Try again</button></main>;
}
