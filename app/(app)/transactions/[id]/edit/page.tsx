"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { TransactionForm, type TransactionFormValues } from "@/components/transaction-form";
import { toast } from "sonner";

export default function EditTransactionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: transaction, isLoading: transactionLoading, isError: transactionError, refetch } = trpc.transactions.get.useQuery({ id: params.id });
  const { data: accounts, isLoading: accountsLoading } = trpc.accounts.list.useQuery();
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const updateMutation = trpc.transactions.update.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.transactions.list.invalidate(), utils.transactions.get.invalidate({ id: params.id }), utils.analytics.dashboard.invalidate(), utils.analytics.monthlyTrend.invalidate(), utils.accounts.list.invalidate()]);
      router.push("/transactions");
      toast.success("Transaction updated");
    },
    onError: () => toast.error("Unable to update transaction"),
  });

  if (transactionLoading || accountsLoading || categoriesLoading) return <div>Loading transaction...</div>;
  if (transactionError || !transaction) return <div><p className="text-destructive">Unable to load this transaction.</p><button className="mt-3 underline" onClick={() => refetch()}>Retry</button></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold">Edit Transaction</h1>
      <p className="mt-2 text-muted-foreground">Update the transaction details</p>
      <TransactionForm accounts={accounts} categories={categories} initialValues={{ accountId: transaction.accountId, categoryId: transaction.categoryId, amount: transaction.amount, date: new Date(transaction.date).toISOString().slice(0, 10), description: transaction.description }} title="Transaction Details" submitLabel="Save Changes" pendingLabel="Saving..." isPending={updateMutation.isPending} onSubmit={(values: TransactionFormValues) => updateMutation.mutate({ id: params.id, ...values })} onCancel={() => router.push("/transactions")} />
      {updateMutation.isError && <p className="mt-4 text-sm text-destructive">Unable to update the transaction. Please check the details and try again.</p>}
    </div>
  );
}
