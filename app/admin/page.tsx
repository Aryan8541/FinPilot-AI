"use client";

import { Activity, Database, MessageSquare, ShieldCheck, Tags, Users, WalletCards } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  ["users", "Registered users", Users],
  ["accounts", "Financial accounts", WalletCards],
  ["categories", "Categories", Tags],
  ["transactions", "Transactions", Activity],
  ["imports", "CSV imports", Database],
  ["chatMessages", "AI messages", MessageSquare],
] as const;

export default function AdminOverviewPage() {
  const { data, isLoading, isError } = trpc.admin.overview.useQuery();
  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([key]) => <div key={key} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>;
  if (isError || !data) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">Unable to load the platform overview.</div>;

  return <div className="space-y-7"><header><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Platform operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">System overview</h1><p className="mt-1 max-w-2xl text-muted-foreground">Aggregate platform health only. User financial records and private conversations are intentionally excluded.</p></header><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([key, label, Icon]) => <Card key={key}><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{data[key]}</p></div><div className="rounded-xl bg-secondary p-3 text-secondary-foreground"><Icon className="h-5 w-5" /></div></CardContent></Card>)}</section><section className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>System status</CardTitle></CardHeader><CardContent className="space-y-3">{Object.entries(data.status).map(([label, status]) => <div key={label} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3"><span className="flex items-center gap-2 text-sm capitalize"><ShieldCheck className="h-4 w-4 text-primary" />{label}</span><span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{status}</span></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Privacy boundary</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">This area reports counts and safe system indicators. It does not query or display transaction descriptions, balances, categories, account details, or AI message content.</p></CardContent></Card></section></div>;
}
