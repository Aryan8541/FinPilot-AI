"use client";

import { useState } from "react";
import { Search, ShieldCheck, UserRound } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [pendingRole, setPendingRole] = useState<{ id: string; name: string; nextRole: "user" | "admin" } | null>(null);
  const utils = trpc.useUtils();
  const users = trpc.admin.users.useQuery({ search: search || undefined });
  const setRole = trpc.admin.setRole.useMutation({ onSuccess: async () => { await utils.admin.users.invalidate(); await utils.admin.overview.invalidate(); setPendingRole(null); toast.success("User role updated"); }, onError: () => toast.error("Unable to update user role") });

  return <div className="space-y-5"><header><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Platform access</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Users</h1><p className="mt-1 text-muted-foreground">Manage explicit platform roles. Financial records remain outside this view.</p></header><Card><CardHeader><CardTitle className="text-lg">User directory</CardTitle><div className="relative mt-4 max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" aria-label="Search users by email" placeholder="Search by email..." value={search} onChange={(event) => setSearch(event.target.value)} /></div></CardHeader><CardContent>{users.isLoading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : users.isError ? <p className="text-sm text-destructive">Unable to load users.</p> : <div className="divide-y">{users.data?.map((user) => <div key={user.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">{user.role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</div><div><p className="font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p><p className="mt-1 text-xs text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</p></div></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.role === "admin" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-secondary text-secondary-foreground"}`}>{user.role}</span><Button variant="outline" size="sm" onClick={() => setPendingRole({ id: user.id, name: user.name, nextRole: user.role === "admin" ? "user" : "admin" })}>{user.role === "admin" ? "Remove admin" : "Make admin"}</Button></div></div>)}</div>}</CardContent></Card><ConfirmDialog open={pendingRole !== null} title={`${pendingRole?.nextRole === "admin" ? "Grant" : "Remove"} admin access?`} description={`${pendingRole?.name ?? "This user"} will ${pendingRole?.nextRole === "admin" ? "be able to access platform administration" : "lose platform administration access"}. This does not grant access to private financial records.`} confirmLabel={pendingRole?.nextRole === "admin" ? "Grant access" : "Remove access"} pending={setRole.isPending} onCancel={() => setPendingRole(null)} onConfirm={() => pendingRole && setRole.mutate({ userId: pendingRole.id, role: pendingRole.nextRole })} /></div>;
}
