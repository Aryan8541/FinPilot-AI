"use client";

import { FileUp } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminImportsPage() {
  const { data, isLoading, isError } = trpc.admin.imports.useQuery();
  if (isLoading) return <div className="h-80 animate-pulse rounded-2xl bg-muted" />;
  if (isError || !data) return <p className="text-destructive">Unable to load import operations.</p>;
  return <div className="space-y-6"><header><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Import monitoring</h1><p className="mt-1 text-muted-foreground">Platform-level import health without imported financial rows.</p></header><div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Recent runs</p><p className="mt-2 text-3xl font-semibold">{data.total}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Successful rows</p><p className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">{data.successfulRows}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Failed rows</p><p className="mt-2 text-3xl font-semibold text-rose-700 dark:text-rose-300">{data.failedRows}</p></CardContent></Card></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileUp className="h-4 w-4 text-primary" />Recent imports</CardTitle></CardHeader><CardContent>{data.logs.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">File</th><th className="p-3">Date</th><th className="p-3">Rows</th><th className="p-3">Failed</th></tr></thead><tbody>{data.logs.map((log) => <tr key={log.id} className="border-b last:border-0"><td className="p-3">{log.filename}</td><td className="p-3">{new Date(log.createdAt).toLocaleString()}</td><td className="p-3">{log.rowCount}</td><td className="p-3">{log.errorCount}</td></tr>)}</tbody></table></div> : <p className="py-10 text-center text-sm text-muted-foreground">No import activity recorded.</p>}</CardContent></Card></div>;
}
