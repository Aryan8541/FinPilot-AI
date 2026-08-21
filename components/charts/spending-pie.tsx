"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
