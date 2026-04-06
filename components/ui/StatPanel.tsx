import type { ReactNode } from "react";

const shellClass =
  "rounded-[22px] border border-[rgba(216,196,160,0.22)] bg-[rgba(6,5,4,0.42)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,247,234,0.06)] backdrop-blur-sm md:px-5 md:py-5";

const grid4Class =
  "grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-0";

const grid3Class =
  "grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-0";

const grid2Class = "grid grid-cols-2 gap-x-4 sm:gap-x-6";

/** Outer frame for hero-style metric groups (dashboard, stats, tasks, habits). */
export function StatPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${shellClass} ${className}`.trim()}>{children}</div>;
}

export function StatGrid({
  columns,
  children,
  className = "",
}: {
  columns: 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}) {
  const g =
    columns === 4 ? grid4Class : columns === 3 ? grid3Class : grid2Class;
  return <div className={`${g} ${className}`.trim()}>{children}</div>;
}

const cell4: [string, string, string, string] = [
  "min-w-0 border-b border-[rgba(216,196,160,0.12)] pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6",
  "min-w-0 border-b border-[rgba(216,196,160,0.12)] pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6",
  "min-w-0 sm:border-r sm:pr-6",
  "min-w-0",
];

const cell3: [string, string, string] = [
  "min-w-0 border-b border-[rgba(216,196,160,0.12)] pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6",
  "min-w-0 border-b border-[rgba(216,196,160,0.12)] pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6",
  "min-w-0 col-span-2 border-t border-[rgba(216,196,160,0.12)] pt-4 sm:col-span-1 sm:border-t-0 sm:pt-0",
];

const cell2: [string, string] = [
  "min-w-0 border-r border-[rgba(216,196,160,0.12)] pr-4 sm:pr-6",
  "min-w-0",
];

export function statCellClass(
  columns: 2 | 3 | 4,
  index: number,
  extra = "",
): string {
  const table = columns === 4 ? cell4 : columns === 3 ? cell3 : cell2;
  const base = table[index] ?? "";
  return `${base} ${extra}`.trim();
}

/** One metric: large number + uppercase label. */
export function StatItem({
  value,
  label,
  accent,
  className = "",
}: {
  value: ReactNode;
  label: string;
  accent?: boolean;
  className?: string;
}) {
  const valueClass = accent
    ? "display-title text-2xl font-semibold tabular-nums text-[#f3ddb0] transition-colors group-hover:text-[#fff2d3]"
    : "display-title text-2xl font-semibold tabular-nums text-[#fff7ea]";
  return (
    <div className={className}>
      <p className={valueClass}>{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-[#d8c4a0]">
        {label}
      </p>
    </div>
  );
}
