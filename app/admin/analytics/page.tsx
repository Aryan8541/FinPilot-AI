"use client";

import { BarChart3, Info } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError } = trpc.admin.analytics.useQuery();
  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>;
  if (isError || !data) return <p className="text-destructive">Unable to load platform analytics.</p>;
  return <div className="space-y-6"><header><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Platform analytics</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Activity at a glance</h1><p className="mt-1 text-muted-foreground">Aggregate operational counts only. No private financial records are loaded.</p></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(data.totals).map(([label, value]) => <Card key={label}><CardContent className="p-5"><p className="text-sm capitalize text-muted-foreground">{label.replace(/([A-Z])/g, " $1")}</p><p className="mt-3 text-3xl font-semibold">{value}</p></CardContent></Card>)}</div><Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Analytics coverage</CardTitle></CardHeader><CardContent><p className="flex items-start gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{data.note}</p></CardContent></Card></div>;
}
