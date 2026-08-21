"use client";

import { trpc } from "@/lib/trpc-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpendingPie } from "@/components/charts/spending-pie";
import { TrendLine } from "@/components/charts/trend-line";
import { CategoryBar } from "@/components/charts/category-bar";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = trpc.analytics.dashboard.useQuery({});
  const { data: trendData } = trpc.analytics.monthlyTrend.useQuery({ months: 6 });

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  const { totalIncome, totalExpenses, netIncome, categoryBreakdown, recentTransactions } =
    dashboardData || {};

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Your financial overview</p>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(totalIncome || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${(totalExpenses || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (netIncome || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${(netIncome || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              <CategoryBar data={categoryBreakdown} />
            ) : (
              <p className="text-center text-muted-foreground py-12">
                No transaction data yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              <SpendingPie data={categoryBreakdown} />
            ) : (
              <p className="text-center text-muted-foreground py-12">
                No transaction data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      {trendData && trendData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine data={trendData} />
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: transaction.category.color + "20",
                        color: transaction.category.color,
                      }}
                    >
                      {transaction.category.name}
                    </span>
                    <span
                      className={`font-semibold ${
                        transaction.category.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.category.type === "income" ? "+" : "-"}$
                      {Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
