"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  BarChart2,
  Trophy,
  Tag,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/achievements", label: "Achievements", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-60 flex-col border-r border-[#2a2a2a] bg-[#0d0d0d] md:flex">
      <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7c3aed]">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-[#f5f5f5]">Track My Habits</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#3b1f6e] text-[#8b5cf6]"
                  : "text-[#888888] hover:bg-[#1c1c1c] hover:text-[#f5f5f5]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
