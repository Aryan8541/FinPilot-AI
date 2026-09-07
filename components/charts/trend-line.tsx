"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const formatCurrency = (value: unknown) => `$${Number(value ?? 0).toFixed(2)}`;

interface TrendLineProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
}

export function TrendLine({ data }: TrendLineProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
        <Tooltip formatter={formatCurrency} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
        <Legend iconType="circle" />
        <Line type="monotone" dataKey="income" stroke="#2d9c95" strokeWidth={2.5} dot={false} name="Income" />
        <Line type="monotone" dataKey="expenses" stroke="#c84b48" strokeWidth={2.5} dot={false} name="Expenses" />
        <Line type="monotone" dataKey="net" stroke="#c99b2e" strokeWidth={2.5} dot={false} name="Net" />
      </LineChart>
    </ResponsiveContainer>
  );
}
