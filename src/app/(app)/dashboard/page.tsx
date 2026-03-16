import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { formatCurrency, formatMonth } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
} from "lucide-react";
import { Transaction } from "@/types";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [incomeAgg, expenseAgg, recentTxs, categoryBreakdown] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 8,
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: start, lte: end }, categoryId: { not: null } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryBreakdown.map((c) => c.categoryId!).filter(Boolean) } },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpense = Number(expenseAgg._sum.amount ?? 0);
  const balance = totalIncome - totalExpense;

  const spendingData = categoryBreakdown.map((c) => ({
    name: catMap[c.categoryId!]?.name ?? "Other",
    color: catMap[c.categoryId!]?.color ?? "#6b7280",
    total: Number(c._sum.amount ?? 0),
  }));

  const transactions: Transaction[] = recentTxs.map((t) => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    category: t.category,
  }));

  return (
    <AppLayout
      title="Dashboard"
      subtitle={formatMonth(month, year)}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Monthly Income"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          change="This month"
          changeType="positive"
        />
        <StatsCard
          title="Monthly Expenses"
          value={formatCurrency(totalExpense)}
          icon={TrendingDown}
          iconColor="text-red-500"
          iconBg="bg-red-100"
          change="This month"
          changeType="negative"
        />
        <StatsCard
          title="Balance"
          value={formatCurrency(balance)}
          icon={DollarSign}
          iconColor={balance >= 0 ? "text-violet-600" : "text-red-500"}
          iconBg={balance >= 0 ? "bg-violet-100" : "bg-red-100"}
          change={balance >= 0 ? "Positive balance" : "Negative balance"}
          changeType={balance >= 0 ? "positive" : "negative"}
        />
        <StatsCard
          title="Savings Rate"
          value={totalIncome > 0 ? `${Math.round((balance / totalIncome) * 100)}%` : "0%"}
          icon={Wallet}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          change="Of income saved"
          changeType="neutral"
        />
      </div>

      {/* Charts + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} />
        </div>
        <div>
          <SpendingChart data={spendingData} />
        </div>
      </div>
    </AppLayout>
  );
}
