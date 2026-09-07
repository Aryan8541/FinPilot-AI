"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const formatCurrency = (value: unknown) => `$${Number(value ?? 0).toFixed(2)}`;

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
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={58} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
        <Tooltip formatter={formatCurrency} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>{chartData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
