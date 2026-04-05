"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyBarChartProps {
  data: Array<{ week: string; count: number }>;
}

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(216,196,160,0.12)"
          />
          <XAxis
            dataKey="week"
            tick={{ fill: "#8d826d", fontSize: 11 }}
            tickLine={false}
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
          <Bar dataKey="count" fill="#c79a52" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
