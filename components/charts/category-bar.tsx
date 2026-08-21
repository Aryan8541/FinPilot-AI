"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryBarProps {
  data: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
}

export function CategoryBar({ data }: CategoryBarProps) {
  const chartData = data.map((item) => ({
    name: item.name,
    amount: item.amount,
    fill: item.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Bar dataKey="amount" />
      </BarChart>
    </ResponsiveContainer>
  );
}
