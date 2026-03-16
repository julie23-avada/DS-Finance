"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Transaction, Category } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function TransactionsPage() {
  const now = new Date();
  const [filters, setFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    type: "",
    categoryId: "",
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      month: String(filters.month),
      year: String(filters.year),
      ...(filters.type && { type: filters.type }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
    });
    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch("/api/categories"),
    ]);
    const [txData, catData] = await Promise.all([txRes.json(), catRes.json()]);
    setTransactions(txData);
    setCategories(catData);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    fetchData();
  }

  const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  return (
    <AppLayout title="Transactions" subtitle="Track your income and expenses">
      <div className="space-y-5">
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Income</p>
            <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Expenses</p>
            <p className="text-lg font-bold text-red-500 mt-1">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Net</p>
            <p className={`text-lg font-bold mt-1 ${totalIncome - totalExpense >= 0 ? "text-violet-600" : "text-red-500"}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TransactionFilters filters={filters} categories={categories} onChange={setFilters} />
          <button
            onClick={() => { setEditTx(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-gray-400">No transactions for this period</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-violet-600 text-sm hover:underline"
              >
                Add your first transaction
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === "INCOME" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                          {tx.type === "INCOME" ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {tx.description || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {tx.category ? (
                        <Badge variant={tx.type === "INCOME" ? "success" : "danger"}>
                          {tx.category.name}
                        </Badge>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(tx.date)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-semibold tabular-nums ${tx.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditTx(tx); setShowForm(true); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTx ? "Edit Transaction" : "Add Transaction"}
      >
        <TransactionForm
          transaction={editTx ?? undefined}
          onSuccess={() => { setShowForm(false); fetchData(); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </AppLayout>
  );
}
