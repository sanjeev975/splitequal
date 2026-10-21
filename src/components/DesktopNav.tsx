"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive } from "@/lib/nav";
const LINKS = [{ href: "/dashboard", label: "Dashboard" }, { href: "/groups", label: "Groups" }, { href: "/analytics", label: "Analytics" }, { href: "/profile", label: "Profile" }];
export function DesktopNav() {
  const path = usePathname() ?? "";
  return (<nav aria-label="Main" className="hidden flex-1 items-center gap-1 md:flex">{LINKS.map(({ href, label }) => (
    <Link key={href} href={href} aria-current={isActive(path, href) ? "page" : undefined} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${isActive(path, href) ? "bg-soft text-soft-fg" : "text-muted hover:text-fg"}`}>{label}</Link>))}</nav>);
}
