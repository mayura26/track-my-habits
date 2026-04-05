"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
        <AreaChart
          data={formatted}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="habitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c79a52" stopOpacity={0.42} />
              <stop offset="95%" stopColor="#c79a52" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(216,196,160,0.12)"
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#8d826d", fontSize: 11 }}
            tickLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fill: "#8d826d", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(17,24,20,0.96)",
              border: "1px solid rgba(216,196,160,0.16)",
              borderRadius: 18,
            }}
            labelStyle={{ color: "#b4a58a" }}
            itemStyle={{ color: "#e6c48b" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#c79a52"
            strokeWidth={2}
            fill="url(#habitGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
