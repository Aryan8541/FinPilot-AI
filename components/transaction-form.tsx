"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: string; name: string };
type Category = { id: string; name: string; color: string; type: string };

export type TransactionFormValues = {
  accountId: string;
  categoryId: string;
  amount: string;
  date: string;
  description: string;
};

export function TransactionForm({
  accounts,
  categories,
  initialValues,
  title,
  submitLabel,
  pendingLabel,
  isPending,
  onSubmit,
  onCancel,
}: {
  accounts?: Account[];
  categories?: Category[];
  initialValues?: Partial<TransactionFormValues>;
  title: string;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<TransactionFormValues>({
    accountId: initialValues?.accountId ?? "",
    categoryId: initialValues?.categoryId ?? "",
    amount: initialValues?.amount ?? "",
    date: initialValues?.date ?? format(new Date(), "yyyy-MM-dd"),
    description: initialValues?.description ?? "",
  });

  return (
    <Card className="mt-6 max-w-2xl shadow-[0_16px_40px_rgba(23,33,31,0.07)]">
      <CardHeader><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Details</p><CardTitle className="text-xl">{title}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={(event) => { event.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <div>
            <Label htmlFor="transaction-account">Account</Label>
            <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
              <SelectTrigger id="transaction-account"><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>{accounts?.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="transaction-category">Category</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger id="transaction-category"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{categories?.map((category) => <SelectItem key={category.id} value={category.id}>{category.name} ({category.type})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="transaction-amount">Amount</Label><Input id="transaction-amount" type="number" step="0.01" value={formData.amount} onChange={(event) => setFormData({ ...formData, amount: event.target.value })} required /></div>
          <div><Label htmlFor="transaction-date">Date</Label><Input id="transaction-date" type="date" value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} required /></div>
          <div><Label htmlFor="transaction-description">Description</Label><Input id="transaction-description" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} required /></div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending || !formData.accountId || !formData.categoryId}>{isPending ? pendingLabel : submitLabel}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
