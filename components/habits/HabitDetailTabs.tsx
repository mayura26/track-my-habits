"use client";

import type { ReactNode } from "react";
import { useState } from "react";

interface HabitDetailTabsProps {
  overview: ReactNode;
  settings: ReactNode;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Two-tab switcher for the habit detail page. Both panels stay mounted and are
 * toggled with the `hidden` attribute so the history grid scroll position and
 * the count-log optimistic state survive tab switches.
 */
export function HabitDetailTabs({ overview, settings }: HabitDetailTabsProps) {
  const [active, setActive] = useState<TabId>("overview");

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Habit detail sections"
        className="surface-panel grid grid-cols-2 gap-1 rounded-full p-1"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`habit-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`habit-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(230,196,139,0.5)] ${
                isActive
                  ? "border border-[rgba(230,196,139,0.5)] bg-[linear-gradient(135deg,#c79a52,#8c6737)] text-[#fff9ef] shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                  : "border border-transparent text-[#b4a58a] hover:text-[#f7f0e1]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="habit-panel-overview"
        aria-labelledby="habit-tab-overview"
        hidden={active !== "overview"}
        className="space-y-6"
      >
        {overview}
      </div>
      <div
        role="tabpanel"
        id="habit-panel-settings"
        aria-labelledby="habit-tab-settings"
        hidden={active !== "settings"}
        className="space-y-6"
      >
        {settings}
      </div>
    </div>
  );
}
