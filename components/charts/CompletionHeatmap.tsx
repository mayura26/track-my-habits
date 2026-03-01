"use client";

interface CompletionHeatmapProps {
  heatmap: Record<string, number>;
}

function getColor(count: number): string {
  if (count === 0) return "#1c1c1c";
  if (count === 1) return "#3b1f6e";
  if (count <= 3) return "#6d28d9";
  if (count <= 6) return "#7c3aed";
  return "#8b5cf6";
}

export function CompletionHeatmap({ heatmap }: CompletionHeatmapProps) {
  const weeks: Array<Array<{ date: string; count: number }>> = [];
  const now = new Date();

  // Build 52 weeks of data
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 364);
  startDate.setHours(0, 0, 0, 0);

  // Align to Sunday
  while (startDate.getDay() !== 0) {
    startDate.setDate(startDate.getDate() - 1);
  }

  const cursor = new Date(startDate);
  while (cursor <= now) {
    const week: Array<{ date: string; count: number }> = [];
    for (let d = 0; d < 7; d++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      week.push({ date: key, count: heatmap[key] ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-3">
        <div className="flex flex-col justify-around pt-5">
          {days.map((d, i) => (
            <span key={i} className="text-xs text-[#888888] leading-[10px]">{d}</span>
          ))}
        </div>
        <div>
          <div className="mb-1 flex gap-1">
            {weeks.map((week, wi) => {
              const firstDay = new Date(week[0].date);
              const showMonth = firstDay.getDate() <= 7;
              return (
                <div key={wi} className="w-[10px] text-center">
                  {showMonth && (
                    <span className="text-[10px] text-[#888888]">
                      {months[firstDay.getMonth()]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(({ date, count }) => (
                  <div
                    key={date}
                    className="h-[10px] w-[10px] rounded-sm"
                    style={{ backgroundColor: getColor(count) }}
                    title={`${date}: ${count} logs`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
