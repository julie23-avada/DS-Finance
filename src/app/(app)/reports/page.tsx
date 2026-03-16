"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatMonth } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface ReportData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: { categoryId: string; name: string; color: string; icon: string; total: number }[];
  trend: { month: number; year: number; income: number; expense: number }[];
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?month=${month}&year=${year}`);
    setData(await res.json());
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const trendData = data?.trend.map((t) => ({
    name: MONTH_NAMES[t.month - 1],
    income: t.income,
    expense: t.expense,
  })) ?? [];

  return (
    <AppLayout title="Reports" subtitle={formatMonth(month, year)}>
      <div className="space-y-6">
        {/* Month selector */}
        <div className="flex items-center gap-3">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Total Income</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.totalIncome)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                </div>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(data.totalExpense)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.balance >= 0 ? "bg-violet-100" : "bg-red-100"}`}>
                    <DollarSign className={`w-5 h-5 ${data.balance >= 0 ? "text-violet-600" : "text-red-500"}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Net Balance</p>
                </div>
                <p className={`text-2xl font-bold ${data.balance >= 0 ? "text-violet-600" : "text-red-500"}`}>
                  {formatCurrency(data.balance)}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trend bar chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Income vs Expenses (6 months)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={trendData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                    <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Category Breakdown</h3>
                {data.categoryBreakdown.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                    No expense data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data.categoryBreakdown} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                        {data.categoryBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Category table */}
            {data.categoryBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">Spending Breakdown</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {data.categoryBreakdown.map((cat) => {
                    const pct = data.totalExpense > 0 ? (cat.total / data.totalExpense) * 100 : 0;
                    return (
                      <div key={cat.categoryId} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="flex-1 text-sm font-medium text-gray-900">{cat.name}</span>
                        <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">{Math.round(pct)}%</span>
                        <span className="text-sm font-semibold text-gray-900 w-24 text-right">{formatCurrency(cat.total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
