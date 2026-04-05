"use client";

import {
  BarChart2,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Plus,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/stats", label: "Progress", icon: BarChart2 },
  { href: "/settings", label: "More", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/habits/new"
        className="fixed right-4 z-20 inline-flex h-14 min-h-[3.5rem] w-14 min-w-[3.5rem] items-center justify-center rounded-full border border-[rgba(230,196,139,0.42)] bg-[linear-gradient(135deg,#d8b16b,#7d9c73)] text-[#111814] shadow-[0_20px_40px_rgba(0,0,0,0.28)] md:hidden bottom-[calc(6rem+env(safe-area-inset-bottom,0px))]"
        aria-label="Create habit"
      >
        <Plus className="h-6 w-6" />
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 md:hidden">
        <div className="flex w-full max-w-[min(100%,28rem)] items-center rounded-[30px] border border-[rgba(216,196,160,0.16)] bg-[rgba(9,13,12,0.86)] px-2 py-2 shadow-[0_24px_50px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-1 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? "bg-[linear-gradient(180deg,rgba(230,196,139,0.16),rgba(125,156,115,0.12))] text-[#f3ddb0]"
                    : "text-[#b4a58a]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
