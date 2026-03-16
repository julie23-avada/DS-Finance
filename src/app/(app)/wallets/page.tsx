"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Wallet } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Wallet as WalletIcon, Users, UserPlus, Loader2, Crown, Shield, User } from "lucide-react";

const COLORS = ["#6366f1","#10b981","#f59e0b","#3b82f6","#a855f7","#ec4899"];

const roleIcon = { OWNER: Crown, ADMIN: Shield, MEMBER: User };
const roleVariant = { OWNER: "info", ADMIN: "warning", MEMBER: "default" } as const;

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState<Wallet | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#6366f1", currency: "USD" });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "MEMBER" as const });
  const [saving, setSaving] = useState(false);

  async function fetchWallets() {
    setLoading(true);
    const res = await fetch("/api/wallets");
    setWallets(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchWallets(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowCreate(false);
    setForm({ name: "", description: "", color: "#6366f1", currency: "USD" });
    fetchWallets();
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!showInvite) return;
    setSaving(true);
    await fetch(`/api/wallets/${showInvite.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });
    setSaving(false);
    setShowInvite(null);
    setInviteForm({ email: "", role: "MEMBER" });
    fetchWallets();
  }

  return (
    <AppLayout title="Family Wallets" subtitle="Shared wallets for your family">
      <div className="space-y-5">
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> New Wallet
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 gap-3">
            <WalletIcon className="w-14 h-14 text-gray-200" />
            <p className="text-gray-400">No shared wallets yet</p>
            <button onClick={() => setShowCreate(true)} className="text-violet-600 text-sm hover:underline">
              Create your first wallet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header bar */}
                <div className="h-2" style={{ backgroundColor: wallet.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: wallet.color + "20" }}>
                        <WalletIcon className="w-5 h-5" style={{ color: wallet.color }} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{wallet.name}</h3>
                        {wallet.description && <p className="text-xs text-gray-500 mt-0.5">{wallet.description}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Balance</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(wallet.balance, wallet.currency)}</p>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <Users className="w-4 h-4" />
                        <span>{wallet.members.length} member{wallet.members.length !== 1 ? "s" : ""}</span>
                      </div>
                      <button
                        onClick={() => setShowInvite(wallet)}
                        className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Invite
                      </button>
                    </div>

                    <div className="space-y-2">
                      {wallet.members.map((m) => {
                        const RoleIcon = roleIcon[m.role];
                        return (
                          <div key={m.id} className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              {m.user.image ? (
                                <img src={m.user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <span className="text-xs font-medium text-gray-600">
                                  {(m.user.name ?? m.user.email)[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{m.user.name ?? m.user.email}</p>
                              <p className="text-xs text-gray-500 truncate">{m.user.email}</p>
                            </div>
                            <Badge variant={roleVariant[m.role]}>
                              <RoleIcon className="w-3 h-3 mr-1 inline" />
                              {m.role}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create wallet modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Wallet">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Family Budget" required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Shared household expenses" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
              {["USD","EUR","GBP","JPY","CAD","AUD","VND","SGD"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-7 h-7 rounded-full ring-offset-2 transition ${form.color === c ? "ring-2 ring-violet-500" : ""}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Wallet
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite modal */}
      <Modal open={!!showInvite} onClose={() => setShowInvite(null)} title={`Invite to ${showInvite?.name}`}>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="family@example.com" required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as "ADMIN" | "MEMBER" })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
              <option value="MEMBER">Member — view & add transactions</option>
              <option value="ADMIN">Admin — manage members</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowInvite(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Invite
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
