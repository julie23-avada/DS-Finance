"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Budget, Category } from "@/types";
import { formatCurrency, formatMonth } from "@/lib/utils";
import { Plus, Trash2, Target, Loader2 } from "lucide-react";

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryId: "", amount: "" });
  const [saving, setSaving] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([
      fetch(`/api/budgets?month=${month}&year=${year}`),
      fetch("/api/categories"),
    ]);
    setBudgets(await bRes.json());
    setCategories(await cRes.json());
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return;
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    fetchBudgets();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount), month, year }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ categoryId: "", amount: "" });
    fetchBudgets();
  }

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const usedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = expenseCategories.filter((c) => !usedCategoryIds.has(c.id));

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <AppLayout title="Budgets" subtitle={formatMonth(month, year)}>
      <div className="space-y-5">
        {/* Month selector */}
        <div className="flex items-center gap-3">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex-1" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Add Budget
          </button>
        </div>

        {/* Summary */}
        {budgets.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Spent</p>
                <p className={`text-2xl font-bold ${totalSpent > totalBudget ? "text-red-500" : "text-violet-600"}`}>
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>
            <ProgressBar value={(totalSpent / totalBudget) * 100} showLabel />
          </div>
        )}

        {/* Budget cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 gap-3">
            <Target className="w-12 h-12 text-gray-200" />
            <p className="text-gray-400">No budgets set for this month</p>
            <button onClick={() => setShowForm(true)} className="text-violet-600 text-sm hover:underline">
              Set your first budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
              const remaining = b.amount - b.spent;
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: b.category.color + "20" }}
                      >
                        <Target className="w-4 h-4" style={{ color: b.category.color }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{b.category.name}</span>
                    </div>
                    <button onClick={() => handleDelete(b.id)} className="text-gray-300 hover:text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Spent</span>
                      <span className={pct > 100 ? "text-red-500 font-semibold" : "text-gray-900 font-semibold"}>
                        {formatCurrency(b.spent)}
                      </span>
                    </div>
                    <ProgressBar value={pct} color={b.category.color} showLabel />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Budget: {formatCurrency(b.amount)}</span>
                      <span className={remaining < 0 ? "text-red-500" : "text-emerald-600"}>
                        {remaining < 0 ? "Over by " : "Left: "}
                        {formatCurrency(Math.abs(remaining))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Budget">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">Select category</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Set Budget
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
