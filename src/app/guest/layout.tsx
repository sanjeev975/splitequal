import Link from "next/link";
import { Logo } from "@/components/Logo";
export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (<div><nav className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#d9ccaa] bg-paper/80"><Link href="/"><Logo size={26} /></Link>
    <div className="flex items-center gap-3"><span className="rounded-full bg-lav px-3 py-1 text-sm font-semibold">Guest mode</span><Link className="btn !py-1 !px-3 text-sm" href="/login">Sign up / Sign in</Link></div></nav>
    <main className="mx-auto max-w-3xl space-y-4 px-5 py-6"><p role="note" className="inset text-sm"><b>Saved on this device only.</b> Clearing your browser data deletes it, so use “Export backup” to keep a copy. Sign up any time and your groups are copied into your account (people without accounts become “Guest” members). Guest mode has no invites, live updates, receipts or notifications.</p>{children}</main></div>);
}
