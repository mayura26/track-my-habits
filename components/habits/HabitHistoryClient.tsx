"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { CountDayEditor } from "@/components/habits/CountDayEditor";
import {
  StatGrid,
  StatItem,
  StatPanel,
  statCellClass,
} from "@/components/ui/StatPanel";
import { parseDateKey } from "@/lib/date-keys";
import { COUNT_SCALE, countScaleColor } from "@/lib/habit-analog-colors";

export type DayCellState =
  | "completed"
  | "partial"
  | "failed"
  | "missing"
  | "out-of-range"
  | "future";

export interface DayCell {
  dateKey: string;
  weekdayIndex: number;
  state: DayCellState;
  value: number;
  isToday: boolean;
}

export interface HistoryStats {
  completionRate: number;
  completed: number;
  failed: number;
  partial: number;
  trackedDays: number;
  windowDays: number;
}

interface HabitHistoryClientProps {
  habitId: string;
  trackingType: string;
  thresholdType: string;
  thresholdValue: number;
  days: DayCell[];
  stats: HistoryStats;
}

// Keep the weekday labels aligned with the Mon-top cell order. Labels shown
// as single letters because the left gutter has to stay narrow.
const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatLongDate(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function cellColor(
  day: DayCell,
  trackingType: string,
  thresholdType: string,
  threshold: number,
): string {
  const { state, value } = day;
  if (state === "out-of-range" || state === "future") {
    return "rgba(247,240,225,0.06)";
  }

  // DAILY COUNT habits use an analog scale — every in-range day gets a color
  // proportional to its progress toward the daily target. Zero-log days show
  // red because, for a daily target, not logging is effectively a miss.
  if (trackingType === "COUNT" && thresholdType === "DAILY") {
    return countScaleColor(value, threshold);
  }

  switch (state) {
    case "completed":
      return "#7d9c73";
    case "partial":
      return "#495b50";
    case "failed":
      return "#b66b5a";
    default:
      return "rgba(247,240,225,0.06)";
  }
}

function cellBorder(
  day: DayCell,
  trackingType: string,
  thresholdType: string,
  threshold: number,
): string {
  if (day.isToday) return "1px solid #e6c48b";
  if (day.state === "out-of-range") {
    return "1px dashed rgba(216,196,160,0.18)";
  }
  if (day.state === "future") {
    return "1px solid rgba(216,196,160,0.14)";
  }
  if (trackingType === "COUNT" && thresholdType === "DAILY") {
    return `1px solid ${countScaleColor(day.value, threshold)}`;
  }
  switch (day.state) {
    case "completed":
      return "1px solid #7d9c73";
    case "partial":
      return "1px solid #495b50";
    case "failed":
      return "1px solid #b66b5a";
    default:
      return "1px solid rgba(216,196,160,0.14)";
  }
}

function describeState(
  day: DayCell,
  trackingType: string,
  thresholdType: string,
  threshold: number,
) {
  if (day.state === "out-of-range") return "Before habit start";
  if (day.state === "future") return "Upcoming";
  if (trackingType === "COUNT") {
    if (thresholdType === "DAILY" && threshold > 0) {
      const pct = Math.round((day.value / threshold) * 100);
      if (day.value >= threshold)
        return `Target met (${day.value} / ${threshold})`;
      return `${pct}% — ${day.value} / ${threshold}`;
    }
    if (day.state === "completed")
      return `Target met (${day.value} / ${threshold})`;
    if (day.state === "partial") return `Partial (${day.value} / ${threshold})`;
    return `No logs (0 / ${threshold})`;
  }
  if (day.state === "completed") return "Completed";
  if (day.state === "failed") return "Marked failed";
  return "Missing";
}

export function HabitHistoryClient({
  habitId,
  trackingType,
  thresholdType,
  thresholdValue,
  days: propsDays,
  stats: propsStats,
}: HabitHistoryClientProps) {
  const router = useRouter();
  // Mirror BackfillClient's useState + sync-from-props pattern so optimistic
  // updates survive the router.refresh round-trip without snapping back.
  const [days, setDays] = useState<DayCell[]>(propsDays);
  useEffect(() => {
    setDays(propsDays);
  }, [propsDays]);
  const [stats, setStats] = useState<HistoryStats>(propsStats);
  useEffect(() => {
    setStats(propsStats);
  }, [propsStats]);

  const [isPending, startTransition] = useTransition();
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const selectedDay = useMemo(
    () => days.find((d) => d.dateKey === selectedDayKey) ?? null,
    [days, selectedDayKey],
  );

  // Recompute local stats whenever `days` changes (optimistic updates).
  const recomputeStats = useCallback((nextDays: DayCell[]): HistoryStats => {
    const inRange = nextDays.filter(
      (d) => d.state !== "out-of-range" && d.state !== "future",
    );
    const completed = inRange.filter((d) => d.state === "completed").length;
    const failed = inRange.filter((d) => d.state === "failed").length;
    const partial = inRange.filter((d) => d.state === "partial").length;
    const trackedDays = completed + failed + partial;
    const windowDays = inRange.length;
    const completionRate =
      windowDays > 0 ? Math.round((completed / windowDays) * 100) : 0;
    return {
      completionRate,
      completed,
      failed,
      partial,
      trackedDays,
      windowDays,
    };
  }, []);

  const updateDayState = useCallback(
    (dateKey: string, updater: (prev: DayCell) => DayCell) => {
      setDays((prev) => {
        const next = prev.map((d) => (d.dateKey === dateKey ? updater(d) : d));
        setStats(recomputeStats(next));
        return next;
      });
    },
    [recomputeStats],
  );

  const markCompleted = useCallback(
    (day: DayCell) => {
      if (isPending) return;
      updateDayState(day.dateKey, (d) => ({
        ...d,
        state: "completed",
        value: trackingType === "COUNT" ? thresholdValue : 1,
      }));
      setSelectedDayKey(null);
      startTransition(async () => {
        await fetch(`/api/habits/${habitId}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dateKey: day.dateKey,
            source: "BACKFILL",
            status: "COMPLETED",
            ...(trackingType === "COUNT" ? { value: thresholdValue } : {}),
          }),
        });
        router.refresh();
      });
    },
    [habitId, isPending, router, thresholdValue, trackingType, updateDayState],
  );

  const markFailed = useCallback(
    (day: DayCell) => {
      if (isPending) return;
      updateDayState(day.dateKey, (d) => ({
        ...d,
        state: "failed",
        value: 0,
      }));
      setSelectedDayKey(null);
      startTransition(async () => {
        await fetch(`/api/habits/${habitId}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dateKey: day.dateKey,
            source: "BACKFILL",
            status: "FAILED",
          }),
        });
        router.refresh();
      });
    },
    [habitId, isPending, router, updateDayState],
  );

  const undoDay = useCallback(
    (day: DayCell) => {
      if (isPending) return;
      const wasFailed = day.state === "failed";
      updateDayState(day.dateKey, (d) => ({
        ...d,
        state: "missing",
        value: 0,
      }));
      setSelectedDayKey(null);
      const statusQuery = wasFailed ? "&status=FAILED" : "";
      startTransition(async () => {
        await fetch(
          `/api/habits/${habitId}/log?dateKey=${encodeURIComponent(day.dateKey)}${statusQuery}`,
          { method: "DELETE" },
        );
        router.refresh();
      });
    },
    [habitId, isPending, router, updateDayState],
  );

  const setCountValue = useCallback(
    (day: DayCell, value: number) => {
      if (isPending) return;
      if (value < 0 || !Number.isFinite(value)) return;
      let nextState: DayCellState;
      if (value === 0) nextState = "partial";
      else if (value >= thresholdValue) nextState = "completed";
      else nextState = "partial";

      updateDayState(day.dateKey, (d) => ({
        ...d,
        state: nextState,
        value,
      }));
      setSelectedDayKey(null);

      startTransition(async () => {
        await fetch(`/api/habits/${habitId}/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dateKey: day.dateKey,
            source: "BACKFILL",
            status: "COMPLETED",
            value,
            replace: true,
          }),
        });
        router.refresh();
      });
    },
    [habitId, isPending, router, thresholdValue, updateDayState],
  );

  const clearCountDay = useCallback(
    (day: DayCell) => {
      if (isPending) return;
      updateDayState(day.dateKey, (d) => ({
        ...d,
        state: "missing",
        value: 0,
      }));
      setSelectedDayKey(null);
      startTransition(async () => {
        await fetch(
          `/api/habits/${habitId}/log?dateKey=${encodeURIComponent(day.dateKey)}&all=true`,
          { method: "DELETE" },
        );
        router.refresh();
      });
    },
    [habitId, isPending, router, updateDayState],
  );

  const handleCellClick = useCallback((day: DayCell) => {
    if (day.state === "out-of-range" || day.state === "future") return;
    setSelectedDayKey(day.dateKey);
  }, []);

  // Group cells into 13 weeks of 7 days each (Mon..Sun per column).
  const weeks = useMemo(() => {
    const out: DayCell[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      out.push(days.slice(i, i + 7));
    }
    return out;
  }, [days]);

  // Month labels above each week: show the month abbreviation when the first
  // cell of a week is in a different month than the previous week's first cell.
  const monthLabels = useMemo(() => {
    const labels: (string | null)[] = [];
    let prevMonth = -1;
    for (const week of weeks) {
      const firstDay = week[0];
      if (!firstDay) {
        labels.push(null);
        continue;
      }
      const { month } = parseDateKey(firstDay.dateKey);
      if (month !== prevMonth) {
        labels.push(MONTH_SHORT[month - 1] ?? null);
        prevMonth = month;
      } else {
        labels.push(null);
      }
    }
    return labels;
  }, [weeks]);

  const isCount = trackingType === "COUNT";
  const thirdStat = isCount
    ? { value: stats.partial, label: "partial days" }
    : { value: stats.failed, label: "failed days" };

  return (
    <div className="space-y-5">
      <StatPanel>
        <StatGrid columns={4}>
          <StatItem
            value={`${stats.completionRate}%`}
            label="completion"
            accent
            className={statCellClass(4, 0)}
          />
          <StatItem
            value={stats.completed}
            label="completed"
            className={statCellClass(4, 1)}
          />
          <StatItem
            value={thirdStat.value}
            label={thirdStat.label}
            className={statCellClass(4, 2)}
          />
          <StatItem
            value={stats.trackedDays}
            label="tracked"
            className={statCellClass(4, 3)}
          />
        </StatGrid>
      </StatPanel>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full items-start gap-2">
          {/* Weekday gutter */}
          <div className="flex flex-col gap-[3px] pt-[18px]">
            {WEEKDAY_LABELS.map((l, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: static label list
                key={i}
                className="flex h-[18px] w-4 items-center justify-center text-[10px] text-[#8d826d]"
              >
                {l}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="min-w-0">
            {/* Month labels strip */}
            <div className="mb-[3px] flex gap-[3px]">
              {monthLabels.map((label, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: parallel to weeks
                  key={i}
                  className="h-[15px] w-[18px] text-[10px] leading-[15px] text-[#8d826d]"
                >
                  {label ?? ""}
                </div>
              ))}
            </div>
            {/* Cells */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: week columns are positional
                  key={wi}
                  className="flex flex-col gap-[3px]"
                >
                  {week.map((day) => {
                    const interactive =
                      day.state !== "out-of-range" && day.state !== "future";
                    const tooltip = `${formatLongDate(day.dateKey)} — ${describeState(day, trackingType, thresholdType, thresholdValue)}`;
                    const style = {
                      backgroundColor: cellColor(
                        day,
                        trackingType,
                        thresholdType,
                        thresholdValue,
                      ),
                      border: cellBorder(
                        day,
                        trackingType,
                        thresholdType,
                        thresholdValue,
                      ),
                    };
                    if (!interactive) {
                      return (
                        <div
                          key={day.dateKey}
                          className="h-[18px] w-[18px] rounded-sm"
                          style={style}
                          title={tooltip}
                          aria-hidden="true"
                        />
                      );
                    }
                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => handleCellClick(day)}
                        disabled={isPending}
                        className="h-[18px] w-[18px] rounded-sm transition-transform duration-150 hover:scale-110 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 disabled:cursor-wait disabled:opacity-60"
                        style={style}
                        title={tooltip}
                        aria-label={tooltip}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Legend trackingType={trackingType} thresholdType={thresholdType} />

      {selectedDay && (
        <DayEditorDialog
          day={selectedDay}
          trackingType={trackingType}
          thresholdValue={thresholdValue}
          isPending={isPending}
          onClose={() => setSelectedDayKey(null)}
          onMarkCompleted={() => markCompleted(selectedDay)}
          onMarkFailed={() => markFailed(selectedDay)}
          onUndo={() => undoDay(selectedDay)}
          onSetValue={(v) => setCountValue(selectedDay, v)}
          onClearCountDay={() => clearCountDay(selectedDay)}
        />
      )}
    </div>
  );
}

function Legend({
  trackingType,
  thresholdType,
}: {
  trackingType: string;
  thresholdType: string;
}) {
  const isDailyCount = trackingType === "COUNT" && thresholdType === "DAILY";

  if (isDailyCount) {
    // Analog scale: render as a single gradient strip with endpoint labels,
    // not a bullet list — communicates the continuous relationship better.
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8d826d]">0%</span>
          <div
            className="h-2 flex-1 rounded-full"
            style={{
              background: `linear-gradient(to right, ${COUNT_SCALE.red}, ${COUNT_SCALE.orange}, ${COUNT_SCALE.yellow}, ${COUNT_SCALE.lime}, ${COUNT_SCALE.green})`,
            }}
          />
          <span className="text-[11px] text-[#8d826d]">target</span>
        </div>
      </div>
    );
  }

  const isCount = trackingType === "COUNT";
  const items: { color: string; label: string; border?: string }[] = isCount
    ? [
        { color: "#7d9c73", label: "Active" },
        {
          color: "rgba(247,240,225,0.06)",
          label: "No logs",
          border: "1px solid rgba(216,196,160,0.14)",
        },
      ]
    : [
        { color: "#7d9c73", label: "Completed" },
        { color: "#b66b5a", label: "Failed" },
        {
          color: "rgba(247,240,225,0.06)",
          label: "Missing",
          border: "1px solid rgba(216,196,160,0.14)",
        },
      ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#8d826d]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: item.color, border: item.border }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}

interface DayEditorDialogProps {
  day: DayCell;
  trackingType: string;
  thresholdValue: number;
  isPending: boolean;
  onClose: () => void;
  onMarkCompleted: () => void;
  onMarkFailed: () => void;
  onUndo: () => void;
  onSetValue: (value: number) => void;
  onClearCountDay: () => void;
}

function DayEditorDialog({
  day,
  trackingType,
  thresholdValue,
  isPending,
  onClose,
  onMarkCompleted,
  onMarkFailed,
  onUndo,
  onSetValue,
  onClearCountDay,
}: DayEditorDialogProps) {
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isCount = trackingType === "COUNT";
  const hasLog = day.state !== "missing";
  const title = formatLongDate(day.dateKey);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 pt-24 backdrop-blur-sm sm:items-center sm:pb-4">
      {/* Overlay click-to-close: a transparent button fills the space so
          keyboard/a11y lint stays happy without needing onKey handlers. */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-editor-title"
        className="surface-panel relative w-full max-w-sm rounded-[24px] border border-[rgba(216,196,160,0.22)] px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d826d]">
              Edit day
            </p>
            <h3
              id="day-editor-title"
              className="mt-1 text-lg font-semibold text-[#fff7ea]"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[#8d826d] hover:text-[#f7f0e1]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-5">
          {isCount ? (
            <CountDayEditor
              value={day.value}
              thresholdValue={thresholdValue}
              isPending={isPending}
              firstButtonRef={firstButtonRef}
              onSave={onSetValue}
              onClearDay={onClearCountDay}
              onCancel={onClose}
              disableClear={day.state === "missing"}
              inputId={`count-day-value-${day.dateKey}`}
            />
          ) : (
            <BooleanEditor
              day={day}
              hasLog={hasLog}
              isPending={isPending}
              firstButtonRef={firstButtonRef}
              onMarkCompleted={onMarkCompleted}
              onMarkFailed={onMarkFailed}
              onUndo={onUndo}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface BooleanEditorProps {
  day: DayCell;
  hasLog: boolean;
  isPending: boolean;
  firstButtonRef: React.RefObject<HTMLButtonElement | null>;
  onMarkCompleted: () => void;
  onMarkFailed: () => void;
  onUndo: () => void;
}

function BooleanEditor({
  day,
  hasLog,
  isPending,
  firstButtonRef,
  onMarkCompleted,
  onMarkFailed,
  onUndo,
}: BooleanEditorProps) {
  if (hasLog) {
    const label =
      day.state === "completed" ? "Marked completed" : "Marked failed";
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#b4a58a]">
          {label}. Tap undo to clear this day.
        </p>
        <button
          ref={firstButtonRef}
          type="button"
          onClick={onUndo}
          disabled={isPending}
          className="w-full rounded-full border border-[rgba(216,196,160,0.22)] bg-[rgba(247,240,225,0.06)] px-4 py-2.5 text-sm font-semibold text-[#f7f0e1] transition-colors hover:bg-[rgba(247,240,225,0.1)] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
        >
          Undo
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#b4a58a]">How did this day go?</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          ref={firstButtonRef}
          type="button"
          onClick={onMarkCompleted}
          disabled={isPending}
          className="rounded-full border border-[#7d9c73] bg-[rgba(125,156,115,0.2)] px-4 py-3 text-sm font-semibold text-[#d9efcd] transition-colors hover:bg-[rgba(125,156,115,0.3)] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
        >
          ✓ Completed
        </button>
        <button
          type="button"
          onClick={onMarkFailed}
          disabled={isPending}
          className="rounded-full border border-[#b66b5a] bg-[rgba(182,107,90,0.2)] px-4 py-3 text-sm font-semibold text-[#f1c4b8] transition-colors hover:bg-[rgba(182,107,90,0.3)] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
        >
          ✗ Failed
        </button>
      </div>
    </div>
  );
}
