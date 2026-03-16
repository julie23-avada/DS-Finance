"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SavingsGoal } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, PiggyBank, Trash2, Pencil, Loader2, Calendar } from "lucide-react";

const COLORS = ["#10b981","#6366f1","#f59e0b","#3b82f6","#a855f7","#ec4899","#ef4444","#14b8a6"];

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [showDeposit, setShowDeposit] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const defaultForm = { name: "", targetAmount: "", currentAmount: "0", targetDate: "", color: "#10b981", description: "" };
  const [form, setForm] = useState(defaultForm);

  async function fetchGoals() {
    setLoading(true);
    const res = await fetch("/api/savings");
    setGoals(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchGoals(); }, []);

  function openEdit(goal: SavingsGoal) {
    setEditGoal(goal);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : "",
      color: goal.color,
      description: goal.description ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount),
      targetDate: form.targetDate || null,
    };
    const url = editGoal ? `/api/savings/${editGoal.id}` : "/api/savings";
    const method = editGoal ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    setShowForm(false);
    setEditGoal(null);
    setForm(defaultForm);
    fetchGoals();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this savings goal?")) return;
    await fetch(`/api/savings/${id}`, { method: "DELETE" });
    fetchGoals();
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!showDeposit) return;
    setSaving(true);
    const newAmount = showDeposit.currentAmount + parseFloat(depositAmount);
    await fetch(`/api/savings/${showDeposit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmount: newAmount }),
    });
    setSaving(false);
    setShowDeposit(null);
    setDepositAmount("");
    fetchGoals();
  }

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <AppLayout title="Savings Goals" subtitle="Track your financial milestones">
      <div className="space-y-5">
        {/* Summary */}
        {goals.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Total Saved</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalSaved)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Target</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalTarget)}</p>
              </div>
            </div>
            <ProgressBar value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0} showLabel color="#10b981" />
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => { setEditGoal(null); setForm(defaultForm); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 gap-3">
            <PiggyBank className="w-14 h-14 text-gray-200" />
            <p className="text-gray-400">No savings goals yet</p>
            <button onClick={() => setShowForm(true)} className="text-violet-600 text-sm hover:underline">
              Create your first goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const completed = pct >= 100;
              return (
                <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: goal.color + "20" }}
                      >
                        <PiggyBank className="w-5 h-5" style={{ color: goal.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{goal.name}</p>
                        {completed && <span className="text-xs text-emerald-600 font-medium">Completed!</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(goal)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(goal.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-gray-500">{goal.description}</p>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-semibold text-gray-900">{Math.min(100, Math.round(pct))}%</span>
                    </div>
                    <ProgressBar value={pct} color={goal.color} />
                    <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                      <span>{formatCurrency(goal.currentAmount)} saved</span>
                      <span>Goal: {formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>

                  {goal.targetDate && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Target: {formatDate(goal.targetDate)}</span>
                    </div>
                  )}

                  <button
                    onClick={() => { setShowDeposit(goal); setDepositAmount(""); }}
                    className="w-full py-2 rounded-lg text-sm font-medium transition border-2 border-dashed hover:border-solid"
                    style={{ borderColor: goal.color, color: goal.color }}
                  >
                    Add Funds
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Goal form modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditGoal(null); }}
        title={editGoal ? "Edit Savings Goal" : "New Savings Goal"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Emergency Fund" required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount *</label>
            <input type="number" step="0.01" min="0.01" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="10,000" required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount</label>
            <input type="number" step="0.01" min="0" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} placeholder="0" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
            <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-7 h-7 rounded-full ring-offset-2 transition ${form.color === c ? "ring-2 ring-violet-500" : ""}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What are you saving for?" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowForm(false); setEditGoal(null); }} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editGoal ? "Update" : "Create Goal"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deposit modal */}
      <Modal open={!!showDeposit} onClose={() => setShowDeposit(null)} title={`Add Funds — ${showDeposit?.name}`}>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Add *</label>
            <input type="number" step="0.01" min="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="500" required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          {showDeposit && (
            <p className="text-sm text-gray-500">
              Current: {formatCurrency(showDeposit.currentAmount)} / {formatCurrency(showDeposit.targetAmount)}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowDeposit(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Funds
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
