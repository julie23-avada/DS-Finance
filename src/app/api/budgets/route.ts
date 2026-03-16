import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
  categoryId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const budgets = await prisma.budget.findMany({
    where: {
      userId: session.user.id,
      ...(month && year ? { month: parseInt(month), year: parseInt(year) } : {}),
    },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  // Calculate spent for each budget
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (b) => {
      const start = new Date(b.year, b.month - 1, 1);
      const end = new Date(b.year, b.month, 0, 23, 59, 59);

      const agg = await prisma.transaction.aggregate({
        where: {
          userId: session.user!.id!,
          categoryId: b.categoryId,
          type: "EXPENSE",
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      return {
        ...b,
        amount: Number(b.amount),
        spent: Number(agg._sum.amount ?? 0),
      };
    })
  );

  return NextResponse.json(budgetsWithSpent);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: session.user.id,
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
        },
      },
      update: { amount: data.amount },
      create: { ...data, userId: session.user.id },
      include: { category: true },
    });

    return NextResponse.json({ ...budget, amount: Number(budget.amount), spent: Number(budget.spent) }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
