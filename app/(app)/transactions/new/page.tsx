"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { TransactionForm, type TransactionFormValues } from "@/components/transaction-form";
import { toast } from "sonner";

export default function NewTransactionPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: accounts, isLoading: accountsLoading } = trpc.accounts.list.useQuery();
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();

  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.transactions.list.invalidate(), utils.analytics.dashboard.invalidate(), utils.analytics.monthlyTrend.invalidate(), utils.accounts.list.invalidate()]);
      toast.success("Transaction created");
      router.push("/transactions");
    },
    onError: () => toast.error("Unable to create transaction"),
  });

  if (accountsLoading || categoriesLoading) return <div>Loading transaction form...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold">New Transaction</h1>
      <p className="mt-2 text-muted-foreground">Record a new income or expense</p>

      <TransactionForm accounts={accounts} categories={categories} title="Transaction Details" submitLabel="Create Transaction" pendingLabel="Creating..." isPending={createMutation.isPending} onSubmit={(values: TransactionFormValues) => createMutation.mutate(values)} onCancel={() => router.push("/transactions")} />
      {createMutation.isError && <p className="mt-4 text-sm text-destructive">Unable to create the transaction. Check the details and try again.</p>}
    </div>
  );
}
