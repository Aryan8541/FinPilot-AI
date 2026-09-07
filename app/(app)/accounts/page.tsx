"use client";

import { useState } from "react";
import { Edit, FolderOpen, Plus, Trash2, Wallet } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

type AccountType = "checking" | "savings" | "credit" | "cash" | "investment";
type Account = { id: string; name: string; type: AccountType; balance: string; currency: string };
const emptyForm = { name: "", type: "checking" as AccountType, balance: "0.00", currency: "USD" };

function AccountFields({ value, onChange }: { value: typeof emptyForm; onChange: (value: typeof emptyForm) => void }) {
  return <div className="space-y-4"><div><Label htmlFor="account-name">Account name</Label><Input id="account-name" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="Everyday checking" required /></div><div><Label htmlFor="account-type">Account type</Label><Select value={value.type} onValueChange={(type) => onChange({ ...value, type: type as AccountType })}><SelectTrigger id="account-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="checking">Checking</SelectItem><SelectItem value="savings">Savings</SelectItem><SelectItem value="credit">Credit card</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="investment">Investment</SelectItem></SelectContent></Select></div><div><Label htmlFor="account-balance">Starting balance</Label><Input id="account-balance" type="number" step="0.01" value={value.balance} onChange={(e) => onChange({ ...value, balance: e.target.value })} required /></div><div><Label htmlFor="account-currency">Currency</Label><Input id="account-currency" value={value.currency} onChange={(e) => onChange({ ...value, currency: e.target.value.toUpperCase() })} maxLength={3} required /></div></div>;
}

export default function AccountsPage() {
  const { data: accounts, isLoading, isError, refetch } = trpc.accounts.list.useQuery();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const refresh = async () => Promise.all([utils.accounts.list.invalidate(), utils.transactions.list.invalidate(), utils.analytics.dashboard.invalidate()]);
  const createMutation = trpc.accounts.create.useMutation({ onSuccess: async () => { await refresh(); setCreateOpen(false); setForm(emptyForm); toast.success("Account created"); }, onError: () => toast.error("Unable to create account") });
  const updateMutation = trpc.accounts.update.useMutation({ onSuccess: async () => { await refresh(); setEditAccount(null); toast.success("Account updated"); }, onError: () => toast.error("Unable to update account") });
  const deleteMutation = trpc.accounts.delete.useMutation({ onSuccess: async () => { await refresh(); setDeleteId(null); toast.success("Account deleted"); }, onError: () => toast.error("Unable to delete account") });

  if (isLoading) return <div className="grid gap-4 md:grid-cols-3"><div className="h-44 animate-pulse rounded-2xl bg-muted" /><div className="h-44 animate-pulse rounded-2xl bg-muted" /><div className="h-44 animate-pulse rounded-2xl bg-muted" /></div>;
  if (isError) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6"><p className="font-semibold">Unable to load accounts.</p><Button className="mt-4" variant="outline" onClick={() => refetch()}>Retry</Button></div>;
  const totalBalance = accounts?.reduce((sum, account) => sum + parseFloat(account.balance), 0) ?? 0;

  return <div className="space-y-5"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Your money</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Accounts</h1><p className="mt-1 text-muted-foreground">A clear view of every place your money lives.</p></div><Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4" />New account</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create account</DialogTitle></DialogHeader><form className="space-y-5" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}><AccountFields value={form} onChange={setForm} /><Button className="w-full" type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create account"}</Button></form></DialogContent></Dialog></header>
    <Card className="bg-primary text-primary-foreground"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-primary-foreground/70">Combined current balance</p><p className="mt-2 text-3xl font-semibold tracking-tight">${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="mt-2 text-xs text-primary-foreground/60">Derived from starting balances and activity</p></div><Wallet className="h-7 w-7 text-accent" /></CardContent></Card>
    {accounts?.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{accounts.map((account) => <Card key={account.id} className="group"><CardHeader className="flex-row items-start justify-between space-y-0"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"><FolderOpen className="h-4 w-4" /></div><div><CardTitle className="text-base">{account.name}</CardTitle><p className="mt-1 text-xs capitalize text-muted-foreground">{account.type}</p></div></div><div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"><Button variant="ghost" size="icon" aria-label={`Edit ${account.name}`} onClick={() => setEditAccount(account)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${account.name}`} onClick={() => setDeleteId(account.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardHeader><CardContent><p className="text-2xl font-semibold tracking-tight">{account.currency} {parseFloat(account.balance).toFixed(2)}</p><p className="mt-2 text-xs text-muted-foreground">Current balance</p></CardContent></Card>)}</div> : <Card><CardContent className="py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><Wallet className="h-5 w-5" /></div><p className="mt-4 font-semibold">No accounts yet</p><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Add your first account to start tracking balances and transactions.</p><Button className="mt-5" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Add account</Button></CardContent></Card>}
    <Dialog open={editAccount !== null} onOpenChange={(open) => !open && setEditAccount(null)}><DialogContent><DialogHeader><DialogTitle>Edit account</DialogTitle></DialogHeader>{editAccount && <EditAccountForm account={editAccount} pending={updateMutation.isPending} onCancel={() => setEditAccount(null)} onSave={(value) => updateMutation.mutate({ id: editAccount.id, ...value })} />}</DialogContent></Dialog>
    <ConfirmDialog open={deleteId !== null} title="Delete this account?" description="The account and its transactions will be permanently removed." pending={deleteMutation.isPending} onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })} /></div>;
}

function EditAccountForm({ account, pending, onCancel, onSave }: { account: Account; pending: boolean; onCancel: () => void; onSave: (value: typeof emptyForm) => void }) {
  const [form, setForm] = useState({ name: account.name, type: account.type, balance: account.balance, currency: account.currency });
  return <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onSave(form); }}><AccountFields value={form} onChange={setForm} /><div className="flex gap-2"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save changes"}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div></form>;
}
