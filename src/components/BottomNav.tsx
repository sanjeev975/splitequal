"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, LayoutDashboard, Plus, User, Users } from "lucide-react";
import { isActive } from "@/lib/nav";

const TABS = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/groups", label: "Groups", Icon: Users },
  { href: "/add", label: "Add", Icon: Plus, primary: true },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/profile", label: "Profile", Icon: User },
];

/** Phone-only tab bar with smooth Framer Motion active background indicators. */
export function BottomNav() {
  const path = usePathname() ?? "";
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="mx-auto grid max-w-md grid-cols-5 relative">
        {TABS.map(({ href, label, Icon, primary }) => {
          const active = isActive(path, href);
          return (
            <li key={href} className="relative">
              <Link href={href} aria-current={active ? "page" : undefined} className={`flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${active ? "text-primary" : "text-muted"}`}>
                {active && !primary && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-1 rounded-xl bg-soft/60 z-0"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                  {primary ? (
                    <motion.span whileTap={{ scale: 0.9 }} className="-mt-4 grid h-11 w-11 place-items-center rounded-full bg-primary text-on shadow-md ring-4 ring-bg">
                      <Icon size={22} aria-hidden />
                    </motion.span>
                  ) : (
                    <Icon size={20} aria-hidden />
                  )}
                  <span>{label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
