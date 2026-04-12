"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";
import { Order } from "@/lib/types";
import { formatPrice, getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "10", search });
    if (statusFilter) params.set("status", statusFilter);
    api.get(`/admin/orders?${params}`).then(({ data }) => {
      if (data.success) { setOrders(data.data || []); setTotal(data.meta?.total || 0); }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [page, search, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      toast.success("Status updated");
      fetchOrders();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="page-enter">
      <h1 className="text-2xl font-bold mb-6">Orders ({total})</h1>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by order number..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-40">
          <option value="">All Status</option>
          {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
              <th className="text-left py-3 px-4">Order</th>
              <th className="text-left py-3 px-4">Customer</th>
              <th className="text-left py-3 px-4">Total</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr> :
            orders.map((order) => (
              <tr key={order.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)]">
                <td className="py-3 px-4 font-medium text-[var(--accent-light)]">{order.order_number}</td>
                <td className="py-3 px-4 text-[var(--text-secondary)]">{order.guest_email || "Registered User"}</td>
                <td className="py-3 px-4 font-semibold">{formatPrice(order.total)}</td>
                <td className="py-3 px-4"><span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span></td>
                <td className="py-3 px-4 text-[var(--text-muted)]">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="input-field py-1 px-2 text-xs w-28">
                    {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
