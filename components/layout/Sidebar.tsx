"use client";

import {
  BarChart2,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Settings,
  Tag,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/BrandLogo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-shell hidden h-screen w-64 shrink-0 flex-col border-r border-[rgba(216,196,160,0.14)] bg-[rgba(9,13,12,0.8)] px-3 py-3 backdrop-blur-xl md:sticky md:top-0 md:flex">
      <div className="surface-panel flex h-full flex-col overflow-hidden rounded-[30px]">
        <div className="border-b border-[rgba(216,196,160,0.14)] px-5 py-5">
          <div className="flex items-start gap-3">
            <BrandLogo
              alt=""
              size={48}
              className="mt-0.5 h-12 w-12 border border-[rgba(230,196,139,0.28)]"
              priority
            />
            <div className="min-w-0">
              <p className="section-kicker">Daily Reset</p>
              <h1 className="display-title mt-2 text-[1.15rem] font-semibold leading-tight text-[#f9f1e2]">
                Track My
                <br />
                Habits
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-[15rem] text-sm leading-6 text-[#b4a58a]">
            A calmer daily system for rituals, chores, and visible progress.
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[linear-gradient(90deg,rgba(230,196,139,0.16),rgba(125,156,115,0.12))] text-[#f8ebcf]"
                    : "text-[#b4a58a] hover:bg-[rgba(247,240,225,0.04)] hover:text-[#f7f0e1]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-[#e6c48b]" : ""}`}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
