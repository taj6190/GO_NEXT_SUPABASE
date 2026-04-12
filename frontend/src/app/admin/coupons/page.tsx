"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { Coupon } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "", type: "percentage" as "percentage" | "fixed", value: "", min_order_amount: "0", max_discount: "0",
    usage_limit: 0, valid_from: "", valid_to: "", is_active: true,
  });

  const fetchCoupons = () => {
    api.get("/admin/coupons?limit=50").then(({ data }) => data.success && setCoupons(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, value: parseFloat(form.value), min_order_amount: parseFloat(form.min_order_amount), max_discount: parseFloat(form.max_discount), valid_from: new Date(form.valid_from).toISOString(), valid_to: new Date(form.valid_to).toISOString() };
      if (editing) { await api.put(`/admin/coupons/${editing.id}`, payload); toast.success("Updated!"); }
      else { await api.post("/admin/coupons", payload); toast.success("Created!"); }
      setShowForm(false); setEditing(null); fetchCoupons();
    } catch (err: any) { toast.error(err.response?.data?.error || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try { await api.delete(`/admin/coupons/${id}`); toast.success("Deleted!"); fetchCoupons(); } catch { toast.error("Failed"); }
  };

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="btn-primary"><Plus className="w-4 h-4" /> Add Coupon</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm text-[var(--text-secondary)] mb-1">Code *</label><input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field" required /></div>
            <div><label className="block text-sm text-[var(--text-secondary)] mb-1">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="input-field"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed (৳)</option></select></div>
            <div><label className="block text-sm text-[var(--text-secondary)] mb-1">Value *</label><input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field" required /></div>
            <div><label className="block text-sm text-[var(--text-secondary)] mb-1">Min Order (৳)</label><input type="number" step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm text-[var(--text-secondary)] mb-1">Max Discount</label><input type="number" step="0.01" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm text-[var(--text-secondary)] mb-1">Usage Limit</label><input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: parseInt(e.target.value) })} className="input-field" /></div>
            <div><label className="block text-sm text-[var(--text-secondary)] mb-1">Valid From *</label><input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="input-field" required /></div>
            <div><label className="block text-sm text-[var(--text-secondary)] mb-1">Valid To *</label><input type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} className="input-field" required /></div>
            <div className="flex items-end gap-3">
              <button type="submit" className="btn-primary">{editing ? "Update" : "Create"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
            <th className="text-left py-3 px-4">Code</th><th className="text-left py-3 px-4">Discount</th><th className="text-left py-3 px-4">Usage</th><th className="text-left py-3 px-4">Valid</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4">Actions</th>
          </tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)]">
                <td className="py-3 px-4 font-bold text-[var(--accent-light)]">{c.code}</td>
                <td className="py-3 px-4">{c.type === "percentage" ? `${c.value}%` : formatPrice(c.value)}</td>
                <td className="py-3 px-4">{c.used_count}/{c.usage_limit || "∞"}</td>
                <td className="py-3 px-4 text-xs text-[var(--text-muted)]">{new Date(c.valid_from).toLocaleDateString()} — {new Date(c.valid_to).toLocaleDateString()}</td>
                <td className="py-3 px-4"><span className={`badge ${c.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{c.is_active ? "Active" : "Inactive"}</span></td>
                <td className="py-3 px-4"><button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--danger)]"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
