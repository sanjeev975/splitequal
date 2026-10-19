import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { InstallButton } from "@/components/InstallButton";
import { GuestMigrationRunner } from "@/components/GuestMigrationRunner";
import { NavAvatar } from "@/components/NavAvatar";
import { LegalFooter } from "@/components/LegalPage";
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (<div><nav className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#d9ccaa] bg-paper/80">
    <Link href="/dashboard"><Logo size={26} /></Link>
    <div className="flex flex-wrap items-center gap-4 font-semibold"><Link href="/dashboard" className="underline-offset-4 hover:underline">Dashboard</Link><Link href="/groups" className="underline-offset-4 hover:underline">Groups</Link><Link href="/analytics" className="underline-offset-4 hover:underline">Analytics</Link><Link href="/profile" className="underline-offset-4 hover:underline">Profile</Link><InstallButton /><NotificationBell /><NavAvatar /></div></nav>
    <main className="mx-auto max-w-3xl px-5 py-6"><GuestMigrationRunner />{children}</main><LegalFooter /></div>);
}
