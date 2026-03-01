"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HabitAreaChartProps {
  data: Array<{ date: string; count: number }>;
}

export function HabitAreaChart({ data }: HabitAreaChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  return (
    <div className="h-64" data-testid="area-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="habitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#888888", fontSize: 11 }}
            tickLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fill: "#888888", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 8 }}
            labelStyle={{ color: "#888888" }}
            itemStyle={{ color: "#8b5cf6" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#habitGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
