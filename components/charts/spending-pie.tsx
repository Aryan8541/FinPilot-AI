"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const formatCurrency = (value: unknown) => `$${Number(value ?? 0).toFixed(2)}`;

interface SpendingPieProps {
  data: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
}

export function SpendingPie({ data }: SpendingPieProps) {
  const chartData = data.map((item) => ({
    name: item.name,
    value: item.amount,
  }));

  const colors = data.map((item) => item.color);

  return (
    <ResponsiveContainer width="100%" height={300} minWidth={0}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={92}
          innerRadius={46}
          paddingAngle={2}
          fill="#2d9c95"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={formatCurrency} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
