import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  // Total income & expense
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: "INCOME", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: "EXPENSE", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  // Category breakdown for expenses
  const categoryBreakdown = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId: session.user.id,
      type: "EXPENSE",
      date: { gte: start, lte: end },
      categoryId: { not: null },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryBreakdown.map((c) => c.categoryId!).filter(Boolean) } },
  });

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  // Monthly trend (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }).reverse();

  const trend = await Promise.all(
    months.map(async (m) => {
      const s = new Date(m.year, m.month - 1, 1);
      const e = new Date(m.year, m.month, 0, 23, 59, 59);
      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId: session.user.id, type: "INCOME", date: { gte: s, lte: e } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId: session.user.id, type: "EXPENSE", date: { gte: s, lte: e } },
          _sum: { amount: true },
        }),
      ]);
      return {
        month: m.month,
        year: m.year,
        income: Number(inc._sum.amount ?? 0),
        expense: Number(exp._sum.amount ?? 0),
      };
    })
  );

  return NextResponse.json({
    totalIncome: Number(incomeAgg._sum.amount ?? 0),
    totalExpense: Number(expenseAgg._sum.amount ?? 0),
    balance: Number(incomeAgg._sum.amount ?? 0) - Number(expenseAgg._sum.amount ?? 0),
    categoryBreakdown: categoryBreakdown.map((c) => ({
      categoryId: c.categoryId,
      name: categoryMap[c.categoryId!]?.name ?? "Unknown",
      color: categoryMap[c.categoryId!]?.color ?? "#6b7280",
      icon: categoryMap[c.categoryId!]?.icon ?? "tag",
      total: Number(c._sum.amount ?? 0),
    })),
    trend,
  });
}
