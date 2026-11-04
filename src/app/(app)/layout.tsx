import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { InstallButton } from "@/components/InstallButton";
import { NavAvatar } from "@/components/NavAvatar";
import { GuestMigrationRunner } from "@/components/GuestMigrationRunner";
import { LegalFooter } from "@/components/LegalPage";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (<div>
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-3 py-1.5 backdrop-blur md:px-5">
      <Link href="/dashboard" className="mr-auto md:mr-4"><Logo size={24} /></Link>
      <DesktopNav />
      <div className="flex items-center gap-3"><InstallButton /><NotificationBell /><NavAvatar /></div></header>
    <main className="mx-auto max-w-3xl px-3 py-3 md:px-5 md:py-5"><GuestMigrationRunner />{children}</main>
    <div className="pb-16 md:pb-0"><LegalFooter /></div>
    <BottomNav /></div>);
}
