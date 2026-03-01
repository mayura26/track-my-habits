"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface WeeklyBarChartProps {
  data: Array<{ week: string; count: number }>;
}

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="week"
            tick={{ fill: "#888888", fontSize: 11 }}
            tickLine={false}
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
          <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
