"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Plus, User, Users } from "lucide-react";
import { isActive } from "@/lib/nav";
const TABS = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard }, { href: "/groups", label: "Groups", Icon: Users }, { href: "/add", label: "Add", Icon: Plus, primary: true },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 }, { href: "/profile", label: "Profile", Icon: User },
];
/** Phone-only tab bar (hidden from the md breakpoint up, where the top bar has the links). */
export function BottomNav() {
  const path = usePathname() ?? "";
  return (<nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
    <ul className="mx-auto grid max-w-md grid-cols-5">{TABS.map(({ href, label, Icon, primary }) => { const active = isActive(path, href);
      return (<li key={href}><Link href={href} aria-current={active ? "page" : undefined} className={`flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${active ? "text-primary" : "text-muted"}`}>
        {primary ? <span className="-mt-4 grid h-11 w-11 place-items-center rounded-full bg-primary text-on shadow-md ring-4 ring-bg"><Icon size={22} aria-hidden /></span> : <Icon size={20} aria-hidden />}
        <span>{label}</span></Link></li>); })}</ul></nav>);
}
