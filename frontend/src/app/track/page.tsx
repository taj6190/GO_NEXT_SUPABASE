"use client";

import { useState } from "react";
import { Search, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { Order } from "@/lib/types";
import { formatPrice, getStatusColor } from "@/lib/utils";

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/orders/track/${orderNumber}`);
      if (data.success) setOrder(data.data);
      else setError("Order not found");
    } catch {
      setError("Order not found. Check the order number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const currentStep = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 page-enter">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-[var(--text-secondary)]">Enter your order number to check status</p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-3 mb-8">
        <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. GN-20260410-1234" className="input-field flex-1" required />
        <button type="submit" disabled={loading} className="btn-primary px-6">
          {loading ? "..." : <Search className="w-5 h-5" />}
        </button>
      </form>

      {error && <p className="text-center text-[var(--danger)] mb-4">{error}</p>}

      {order && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Order</p>
              <p className="text-lg font-bold text-[var(--accent-light)]">{order.order_number}</p>
            </div>
            <span className={`badge ${getStatusColor(order.status)}`}>{order.status.toUpperCase()}</span>
          </div>

          {/* Progress */}
          {order.status !== "cancelled" && (
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"}`}>
                    {i <= currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs ml-1 mr-3 ${i <= currentStep ? "text-[var(--accent-light)]" : "text-[var(--text-muted)]"}`}>{step}</span>
                  {i < statusSteps.length - 1 && <div className={`w-8 h-0.5 ${i < currentStep ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Total</span><span className="font-bold">{formatPrice(order.total)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Payment</span><span>{order.payment?.method?.toUpperCase()} — {order.payment?.status}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Date</span><span>{new Date(order.created_at).toLocaleDateString()}</span></div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <h3 className="font-semibold mb-3">Items</h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="text-[var(--text-secondary)]">{item.product_name} × {item.quantity}</span>
                  <span>{formatPrice(item.total_price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
