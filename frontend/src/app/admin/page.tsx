"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingCart, DollarSign, TrendingUp, Clock, AlertTriangle, ArrowUpRight, BarChart3 } from "lucide-react";
import api from "@/lib/api";
import { DashboardStats, Order } from "@/lib/types";
import { formatPrice, getStatusColor, timeAgo } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then(({ data }) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  const cards = [
    { label: "Total Revenue", value: formatPrice(stats?.total_revenue || "0"), icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-500/20" },
    { label: "Today's Revenue", value: formatPrice(stats?.today_revenue || "0"), icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20" },
    { label: "Total Orders", value: stats?.total_orders || 0, icon: ShoppingCart, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20" },
    { label: "Total Products", value: stats?.total_products || 0, icon: Package, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-500/20" },
  ];

  const statusCards = [
    { label: "Pending", value: stats?.pending_orders || 0, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Processing", value: stats?.processing_orders || 0, icon: BarChart3, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Delivered", value: stats?.delivered_orders || 0, icon: Package, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Low Stock", value: stats?.low_stock_products || 0, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10" },
  ];

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Welcome back! Here&apos;s what&apos;s happening</p>
        </div>
        <Link href="/admin/orders" className="btn-secondary btn-sm">
          View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className={`glass-card-static p-5 border ${card.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statusCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <div className="glass-card-static p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold">{card.value}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{card.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      {stats?.revenue_by_day && stats.revenue_by_day.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="glass-card-static p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Revenue Overview</h2>
                <p className="text-xs text-[var(--text-muted)]">Last 30 days</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-[var(--accent)] to-[var(--accent-light)]" />
                <span className="text-xs text-[var(--text-muted)]">Revenue</span>
              </div>
            </div>
            <div className="flex items-end gap-[3px] h-44">
              {stats.revenue_by_day.map((day, i) => {
                const maxRevenue = Math.max(...stats.revenue_by_day.map((d) => parseFloat(d.revenue)));
                const height = maxRevenue > 0 ? (parseFloat(day.revenue) / maxRevenue) * 100 : 5;
                return (
                  <div key={i} className="flex-1 group relative cursor-pointer">
                    <div
                      className="bg-gradient-to-t from-[var(--accent)] to-[var(--accent-light)] rounded-t-sm transition-all group-hover:opacity-80"
                      style={{ height: `${Math.max(height, 3)}%` }}
                    />
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs whitespace-nowrap z-10 shadow-lg">
                      <p className="font-semibold">{formatPrice(day.revenue)}</p>
                      <p className="text-[var(--text-muted)]">{day.orders} orders</p>
                      <p className="text-[var(--text-muted)]">{day.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Orders */}
      {stats?.recent_orders && stats.recent_orders.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="glass-card-static p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs text-[var(--accent-light)] hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="text-left py-2.5 font-medium">Order</th>
                    <th className="text-left py-2.5 font-medium">Status</th>
                    <th className="text-left py-2.5 font-medium">Total</th>
                    <th className="text-left py-2.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.map((order: Order) => (
                    <tr key={order.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="py-3">
                        <Link href={`/admin/orders`} className="font-medium text-[var(--accent-light)] hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                      </td>
                      <td className="py-3 font-semibold">{formatPrice(order.total)}</td>
                      <td className="py-3 text-[var(--text-muted)]">{timeAgo(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/admin/products/new", label: "Add Product", emoji: "📦" },
          { href: "/admin/categories", label: "Categories", emoji: "📂" },
          { href: "/admin/coupons", label: "Coupons", emoji: "🏷️" },
          { href: "/admin/users", label: "Users", emoji: "👥" },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="glass-card-static p-4 flex items-center gap-3 hover:border-[var(--accent)] transition-all group">
            <span className="text-2xl group-hover:scale-110 transition-transform">{link.emoji}</span>
            <span className="text-sm font-medium">{link.label}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
}
