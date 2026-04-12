"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Payment } from "@/lib/types";
import { formatPrice, getStatusColor } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/payments?limit=50").then(({ data }) => data.success && setPayments(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter">
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
            <th className="text-left py-3 px-4">Order</th><th className="text-left py-3 px-4">Method</th><th className="text-left py-3 px-4">Amount</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4">Transaction</th><th className="text-left py-3 px-4">Date</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr> :
            payments.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)]">
                <td className="py-3 px-4 text-[var(--accent-light)]">{p.order_id.slice(0,8)}...</td>
                <td className="py-3 px-4 uppercase font-medium">{p.method}</td>
                <td className="py-3 px-4 font-semibold">{formatPrice(p.amount)}</td>
                <td className="py-3 px-4"><span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span></td>
                <td className="py-3 px-4 text-[var(--text-muted)]">{p.transaction_id || "-"}</td>
                <td className="py-3 px-4 text-[var(--text-muted)]">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
