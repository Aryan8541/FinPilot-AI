"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, CreditCard, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpendingPie } from "@/components/charts/spending-pie";
import { TrendLine } from "@/components/charts/trend-line";
import { CategoryBar } from "@/components/charts/category-bar";

const currency = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const { data: dashboardData, isLoading, isError, refetch } = trpc.analytics.dashboard.useQuery({});
  const { data: trendData } = trpc.analytics.monthlyTrend.useQuery({ months: 6 });
  const { data: accounts } = trpc.accounts.list.useQuery();

  if (isLoading) {
    return <div className="space-y-5"><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="grid gap-4 md:grid-cols-3"><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-32 animate-pulse rounded-2xl bg-muted" /></div><div className="h-80 animate-pulse rounded-2xl bg-muted" /></div>;
  }
  if (isError) {
    return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6"><p className="font-semibold">We couldn&apos;t load your overview.</p><p className="mt-1 text-sm text-muted-foreground">Your data is safe. Try loading the dashboard again.</p><Button className="mt-4" variant="outline" onClick={() => refetch()}>Retry</Button></div>;
  }

  const { totalIncome = 0, totalExpenses = 0, netIncome = 0, categoryBreakdown = [], recentTransactions = [] } = dashboardData || {};
  const totalBalance = accounts?.reduce((sum, account) => sum + parseFloat(account.balance), 0) ?? 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Financial overview</p><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Good to see you.</h1><p className="mt-2 max-w-xl text-muted-foreground">A calm view of your money this month, with the details close at hand.</p></div>
        <div className="flex gap-2"><Button variant="outline" asChild><Link href="/import"><ArrowUpRight className="h-4 w-4" />Import CSV</Link></Button><Button asChild><Link href="/transactions/new"><Plus className="h-4 w-4" />Add transaction</Link></Button></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-primary text-primary-foreground"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-primary-foreground/70">Current balance</p><p className="mt-3 text-3xl font-semibold tracking-tight">{currency(totalBalance)}</p></div><Wallet className="h-5 w-5 text-accent" /></div><p className="mt-4 text-xs text-primary-foreground/60">Across {accounts?.length ?? 0} account{accounts?.length === 1 ? "" : "s"}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Income</p><p className="mt-3 text-2xl font-semibold tracking-tight">{currency(totalIncome)}</p></div><div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><TrendingUp className="h-4 w-4" /></div></div><p className="mt-4 text-xs text-muted-foreground">This month</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Expenses</p><p className="mt-3 text-2xl font-semibold tracking-tight">{currency(totalExpenses)}</p></div><div className="rounded-xl bg-rose-100 p-2.5 text-rose-700 dark:bg-rose-950 dark:text-rose-300"><TrendingDown className="h-4 w-4" /></div></div><p className="mt-4 text-xs text-muted-foreground">This month</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Net movement</p><p className={`mt-3 text-2xl font-semibold tracking-tight ${netIncome >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{currency(netIncome)}</p></div><CreditCard className="h-5 w-5 text-muted-foreground" /></div><p className="mt-4 text-xs text-muted-foreground">Income minus expenses</p></CardContent></Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Six-month movement</CardTitle><p className="mt-1 text-sm text-muted-foreground">Income, expenses, and net movement over time.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Trend</span></CardHeader><CardContent>{trendData?.length ? <TrendLine data={trendData} /> : <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No trend data yet. Add a transaction to begin.</div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Where spending goes</CardTitle><p className="mt-1 text-sm text-muted-foreground">Expense categories for this month.</p></CardHeader><CardContent>{categoryBreakdown.length ? <SpendingPie data={categoryBreakdown} /> : <div className="flex h-[300px] items-center justify-center text-center text-sm text-muted-foreground">No spending yet.<br />Add a transaction to see the pattern.</div>}</CardContent></Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card><CardHeader><CardTitle>Spending by category</CardTitle><p className="mt-1 text-sm text-muted-foreground">The categories carrying the most weight this month.</p></CardHeader><CardContent>{categoryBreakdown.length ? <CategoryBar data={categoryBreakdown} /> : <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">No category activity yet.</div>}</CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Recent activity</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/transactions">View all<ArrowUpRight className="h-3.5 w-3.5" /></Link></Button></CardHeader><CardContent>{recentTransactions.length ? <div className="space-y-1">{recentTransactions.slice(0, 6).map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-3 border-b py-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{transaction.description}</p><p className="mt-1 text-xs text-muted-foreground">{format(new Date(transaction.date), "MMM d, yyyy")} · {transaction.category.name}</p></div><span className={`shrink-0 text-sm font-semibold ${transaction.category.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{transaction.category.type === "income" ? "+" : "-"}{currency(Math.abs(parseFloat(transaction.amount)))}</span></div>)}</div> : <div className="py-12 text-center"><p className="font-medium">No activity yet</p><p className="mt-1 text-sm text-muted-foreground">Add or import your first transaction.</p></div>}</CardContent></Card>
      </section>
    </div>
  );
}
