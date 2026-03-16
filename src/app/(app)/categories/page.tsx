"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui/Modal";
import { Category } from "@/types";
import { Plus, Tag, Lock } from "lucide-react";
import { Loader2 } from "lucide-react";

const COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#a855f7", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6",
  "#6b7280", "#0ea5e9",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "EXPENSE" as const, icon: "tag", color: "#6366f1" });
  const [saving, setSaving] = useState(false);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", type: "EXPENSE", icon: "tag", color: "#6366f1" });
    fetchCategories();
  }

  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");

  return (
    <AppLayout title="Categories" subtitle="Organize your transactions">
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[{ label: "Income Categories", list: income }, { label: "Expense Categories", list: expense }].map(
            ({ label, list }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">{label}</h3>
                </div>
                <ul className="divide-y divide-gray-50">
                  {list.map((cat) => (
                    <li key={cat.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.color + "20" }}
                      >
                        <Tag className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-900">{cat.name}</span>
                      {cat.isDefault && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Lock className="w-3 h-3" /> Default
                        </span>
                      )}
                      <div
                        className="w-4 h-4 rounded-full border border-gray-200 shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                    </li>
                  ))}
                  {list.length === 0 && (
                    <li className="px-5 py-8 text-center text-sm text-gray-400">No categories yet</li>
                  )}
                </ul>
              </div>
            )
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Category">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Groceries"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2 text-sm font-medium transition ${
                    form.type === t
                      ? t === "INCOME" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t === "INCOME" ? "Income" : "Expense"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-full transition ring-offset-2 ${form.color === c ? "ring-2 ring-violet-500" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
