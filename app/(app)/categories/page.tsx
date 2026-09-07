"use client";

import { useState } from "react";
import { Edit, Plus, Tag, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

const PRESET_COLORS = ["#c84b48", "#d97745", "#c99b2e", "#5c9b58", "#2d9c95", "#3c82a5", "#6c70b5", "#a2679b", "#b95d78"];
type CategoryType = "income" | "expense";
type Category = { id: string; name: string; color: string; icon: string | null; type: CategoryType };
type CategoryForm = { name: string; type: CategoryType; color: string; icon: string };
const emptyForm: CategoryForm = { name: "", type: "expense", color: PRESET_COLORS[0], icon: "" };

function CategoryFields({ value, onChange }: { value: CategoryForm; onChange: (value: CategoryForm) => void }) {
  return <div className="space-y-4"><div><Label htmlFor="category-name">Category name</Label><Input id="category-name" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="Groceries" required /></div><div><Label htmlFor="category-type">Type</Label><Select value={value.type} onValueChange={(type) => onChange({ ...value, type: type as CategoryType })}><SelectTrigger id="category-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem></SelectContent></Select></div><div><Label>Color</Label><div className="mt-2 flex flex-wrap gap-2">{PRESET_COLORS.map((color) => <button key={color} type="button" aria-label={`Choose color ${color}`} className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${value.color === color ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: color }} onClick={() => onChange({ ...value, color })} />)}</div></div><div><Label htmlFor="category-icon">Icon or symbol <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="category-icon" value={value.icon} onChange={(e) => onChange({ ...value, icon: e.target.value })} maxLength={50} placeholder="🛒" /></div></div>;
}

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = trpc.categories.list.useQuery();
  const utils = trpc.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const refresh = async () => Promise.all([utils.categories.list.invalidate(), utils.transactions.list.invalidate(), utils.analytics.dashboard.invalidate()]);
  const createMutation = trpc.categories.create.useMutation({ onSuccess: async () => { await refresh(); setCreateOpen(false); setForm(emptyForm); toast.success("Category created"); }, onError: () => toast.error("Unable to create category") });
  const updateMutation = trpc.categories.update.useMutation({ onSuccess: async () => { await refresh(); setEditCategory(null); toast.success("Category updated"); }, onError: () => toast.error("Unable to update category") });
  const deleteMutation = trpc.categories.delete.useMutation({ onSuccess: async () => { await refresh(); setDeleteId(null); toast.success("Category deleted"); }, onError: () => toast.error("Unable to delete category") });
  if (isLoading) return <div className="grid gap-4 md:grid-cols-3"><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /><div className="h-28 animate-pulse rounded-2xl bg-muted" /></div>;
  if (isError) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6"><p className="font-semibold">Unable to load categories.</p><Button className="mt-4" variant="outline" onClick={() => refetch()}>Retry</Button></div>;
  const income = categories?.filter((category) => category.type === "income") ?? [];
  const expense = categories?.filter((category) => category.type === "expense") ?? [];
  const section = (title: string, items: typeof income, tone: string) => <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{items.length} categor{items.length === 1 ? "y" : "ies"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{title === "Income" ? "Money in" : "Money out"}</span></div>{items.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((category) => <Card key={category.id} className="group"><CardContent className="flex items-center justify-between gap-3 p-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${category.color}22`, color: category.color }}>{category.icon || <Tag className="h-4 w-4" />}</div><div className="min-w-0"><p className="truncate font-medium">{category.name}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{category.type}</p></div></div><div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"><Button variant="ghost" size="icon" aria-label={`Edit ${category.name}`} onClick={() => setEditCategory(category)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${category.name}`} onClick={() => setDeleteId(category.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardContent></Card>)}</div> : <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No {title.toLowerCase()} categories yet.</CardContent></Card>}</section>;

  return <div className="space-y-7"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Taxonomy</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Categories</h1><p className="mt-1 text-muted-foreground">Give every transaction a useful place to land.</p></div><Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4" />New category</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create category</DialogTitle></DialogHeader><form className="space-y-5" onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, icon: form.icon || undefined }); }}><CategoryFields value={form} onChange={setForm} /><Button className="w-full" type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create category"}</Button></form></DialogContent></Dialog></header><div className="space-y-7">{section("Income", income, "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300")}{section("Expenses", expense, "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300")}</div><Dialog open={editCategory !== null} onOpenChange={(open) => !open && setEditCategory(null)}><DialogContent><DialogHeader><DialogTitle>Edit category</DialogTitle></DialogHeader>{editCategory && <EditCategoryForm category={editCategory} pending={updateMutation.isPending} onCancel={() => setEditCategory(null)} onSave={(value) => updateMutation.mutate({ id: editCategory.id, ...value, icon: value.icon || undefined })} />}</DialogContent></Dialog><ConfirmDialog open={deleteId !== null} title="Delete this category?" description="Transactions using this category may prevent deletion." pending={deleteMutation.isPending} onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate({ id: deleteId })} /></div>;
}

function EditCategoryForm({ category, pending, onCancel, onSave }: { category: Category; pending: boolean; onCancel: () => void; onSave: (value: CategoryForm) => void }) { const [form, setForm] = useState({ name: category.name, type: category.type, color: category.color, icon: category.icon ?? "" }); return <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onSave(form); }}><CategoryFields value={form} onChange={setForm} /><div className="flex gap-2"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save changes"}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div></form>; }
