"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Eye, Clock, ChevronRight, ShoppingBag } from "lucide-react";
import api from "@/lib/api";
import { Order } from "@/lib/types";
import { formatPrice, getStatusColor, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { motion } from "framer-motion";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get("/orders")
      .then(({ data }) => {
        if (data.success) setOrders(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center page-enter">
        <Package className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Login to view your orders</h2>
        <p className="text-[var(--text-muted)] mb-6">Track your orders and manage your purchase history</p>
        <Link href="/login" className="btn-primary">
          Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="skeleton h-8 w-48 mb-6 rounded-lg" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-[var(--text-muted)]">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-bold mb-2">No orders yet</h3>
          <p className="text-[var(--text-muted)] mb-6">Start shopping to see your orders here</p>
          <Link href="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="glass-card-static p-5 hover:border-[var(--border-light)] transition-colors">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--accent-light)]">{order.order_number}</p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Clock className="w-3 h-3" /> {timeAgo(order.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${getStatusColor(order.status)}`}>{order.status.toUpperCase()}</span>
                    <Link href={`/track?order=${order.order_number}`} className="btn-secondary btn-sm py-1.5 text-xs">
                      <Eye className="w-3.5 h-3.5" /> Track
                    </Link>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--bg-tertiary)] flex-shrink-0 relative">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product_slug}`} className="text-sm font-medium truncate block hover:text-[var(--accent-light)] transition-colors">
                          {item.product_name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <span>Qty: {item.quantity}</span>
                          {item.variant_options && <span>• {item.variant_options}</span>}
                        </div>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">{formatPrice(item.total_price)}</span>
                    </div>
                  ))}
                  {order.items && order.items.length > 3 && (
                    <p className="text-xs text-[var(--text-muted)] pl-15">
                      +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span>Payment: {order.payment?.method?.toUpperCase() || "N/A"}</span>
                    <span className={`badge text-[10px] ${getStatusColor(order.payment?.status || "pending")}`}>{order.payment?.status || "pending"}</span>
                  </div>
                  <span className="font-bold text-lg text-[var(--accent-light)]">{formatPrice(order.total)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
