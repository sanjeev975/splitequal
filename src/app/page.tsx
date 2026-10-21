import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LegalFooter } from "@/components/LegalPage";
export default function Landing() {
  return (<main className="mx-auto max-w-4xl px-5 py-10">
    <header className="flex items-center justify-between"><Logo /><Link href="/login" className="btn">Sign in</Link></header>
    <section className="mt-16 grid gap-8 md:grid-cols-2 items-center">
      <div><h1 className="font-display text-5xl font-bold text-navy leading-tight">Every expense.<br/><span className="text-coral">Fairly shared.</span></h1>
        <p className="mt-4 text-lg">Trips, rent, groceries and bills — split exactly, down to the last paisa.</p>
        <Link href="/login" className="btn btn-coral mt-6 inline-block">Start a group</Link> <Link href="/guest" className="btn mt-6 ml-3 inline-block">Try without an account</Link></div>
      <div className="receipt"><p className="font-bold">GOA TRIP — DINNER</p><p>Total ........ ₹3,000.00</p><p>Asha paid</p><p>Split 3 ways ..... ₹1,000.00</p>
        <p className="mt-2 text-emerald font-bold">Ravi owes Asha ₹1,000.00</p><p className="text-xs mt-2 opacity-60">(illustrative sample)</p></div>
    </section><LegalFooter /></main>);
}
