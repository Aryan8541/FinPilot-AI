"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowUpRight, Edit, Plus, Search, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

const PAGE_SIZE = 20;
type Filters = { search: string; accountId: string; categoryId: string; type: string; startDate: string; endDate: string };
const amountLabel = (type: string, amount: string) => `${type === "income" ? "+" : "-"}$${Math.abs(parseFloat(amount)).toFixed(2)}`;

export default function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>({ search: "", accountId: "", categoryId: "", type: "", startDate: "", endDate: "" });
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const query = trpc.transactions.list.useQuery({ search: filters.search || undefined, accountId: filters.accountId || undefined, categoryId: filters.categoryId || undefined, type: (filters.type || undefined) as "income" | "expense" | undefined, startDate: filters.startDate || undefined, endDate: filters.endDate || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: async () => { setDeleteId(null); await Promise.all([utils.transactions.list.invalidate(), utils.analytics.dashboard.invalidate(), utils.analytics.monthlyTrend.invalidate(), utils.accounts.list.invalidate()]); toast.success("Transaction deleted"); },
    onError: () => toast.error("Unable to delete transaction"),
  });
  const updateFilter = (name: keyof Filters, value: string) => { setFilters({ ...filters, [name]: value }); setPage(0); };

  if (query.isLoading) return <div className="space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-muted" /><div className="h-96 animate-pulse rounded-2xl bg-muted" /></div>;
  if (query.isError) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6"><p className="font-semibold">Unable to load transactions.</p><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Retry</Button></div>;
  const visibleTransactions = query.data ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Ledger</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Transactions</h1><p className="mt-1 text-muted-foreground">Search, filter, and keep every movement accountable.</p></div><Button asChild><Link href="/transactions/new"><Plus className="h-4 w-4" />New transaction</Link></Button></header>
      <Card className="p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative sm:col-span-2 lg:col-span-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search transactions" placeholder="Search descriptions..." className="pl-10" value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} /></div>
        <Select value={filters.accountId || "all"} onValueChange={(v) => updateFilter("accountId", v === "all" ? "" : v)}><SelectTrigger aria-label="Filter by account"><SelectValue placeholder="All accounts" /></SelectTrigger><SelectContent><SelectItem value="all">All accounts</SelectItem>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.categoryId || "all"} onValueChange={(v) => updateFilter("categoryId", v === "all" ? "" : v)}><SelectTrigger aria-label="Filter by category"><SelectValue placeholder="All categories" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={filters.type || "all"} onValueChange={(v) => updateFilter("type", v === "all" ? "" : v)}><SelectTrigger aria-label="Filter by transaction type"><SelectValue placeholder="All types" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select>
        <Input aria-label="Filter from date" type="date" value={filters.startDate} onChange={(e) => updateFilter("startDate", e.target.value)} /><Input aria-label="Filter through date" type="date" value={filters.endDate} onChange={(e) => updateFilter("endDate", e.target.value)} />
      </div></Card>
      <Card className="overflow-hidden">
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted/50"><tr className="border-b text-left"><th className="px-5 py-3 font-medium text-muted-foreground">Date</th><th className="px-5 py-3 font-medium text-muted-foreground">Description</th><th className="px-5 py-3 font-medium text-muted-foreground">Account</th><th className="px-5 py-3 font-medium text-muted-foreground">Category</th><th className="px-5 py-3 text-right font-medium text-muted-foreground">Amount</th><th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th></tr></thead><tbody>{visibleTransactions.map((transaction) => <tr key={transaction.id} className="border-b transition-colors last:border-0 hover:bg-muted/30"><td className="px-5 py-4 text-muted-foreground">{format(new Date(transaction.date), "MMM d, yyyy")}</td><td className="px-5 py-4 font-medium">{transaction.description}</td><td className="px-5 py-4 text-muted-foreground">{transaction.account.name}</td><td className="px-5 py-4"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{transaction.category.name}</span></td><td className={`px-5 py-4 text-right font-semibold ${transaction.category.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{amountLabel(transaction.category.type, transaction.amount)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label={`Edit ${transaction.description}`} asChild><Link href={`/transactions/${transaction.id}/edit`}><Edit className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" aria-label={`Delete ${transaction.description}`} onClick={() => setDeleteId(transaction.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></td></tr>)}</tbody></table></div>
        <div className="divide-y md:hidden">{visibleTransactions.map((transaction) => <div key={transaction.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{transaction.description}</p><p className="mt-1 text-xs text-muted-foreground">{format(new Date(transaction.date), "MMM d, yyyy")} · {transaction.account.name}</p></div><span className={`shrink-0 text-sm font-semibold ${transaction.category.type === "income" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{amountLabel(transaction.category.type, transaction.amount)}</span></div><div className="mt-3 flex items-center justify-between"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{transaction.category.name}</span><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Edit ${transaction.description}`} asChild><Link href={`/transactions/${transaction.id}/edit`}><Edit className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" aria-label={`Delete ${transaction.description}`} onClick={() => setDeleteId(transaction.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div></div>)}</div>
        {visibleTransactions.length === 0 && <div className="px-6 py-16 text-center"><p className="font-medium">No transactions found</p><p className="mt-1 text-sm text-muted-foreground">Add a transaction or adjust your filters to get started.</p><Button className="mt-4" variant="outline" asChild><Link href="/transactions/new"><Plus className="h-4 w-4" />Add transaction</Link></Button></div>}
      </Card>
      <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Page {page + 1}</span><div className="flex gap-2"><Button variant="outline" disabled={page === 0 || query.isFetching} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={(query.data?.length ?? 0) < PAGE_SIZE || query.isFetching} onClick={() => setPage(page + 1)}>Next<ArrowUpRight className="h-4 w-4" /></Button></div></div>
      {deleteMutation.isError && <p className="text-sm text-destructive">Unable to delete the transaction. Please try again.</p>}
      <ConfirmDialog open={deleteId !== null} title="Delete this transaction?" description="This transaction will be permanently removed." pending={deleteMutation.isPending} onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })} />
    </div>
  );
}
