"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Tag, CreditCard, Shield, Menu, X, ChevronLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2.5 px-4 py-5 mb-2 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg">Admin</span>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 rounded-lg hover:bg-[var(--bg-tertiary)]">
          <X className="w-4 h-4" />
        </button>
      </div>
      <nav className="px-3 space-y-0.5">
        {adminLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[var(--accent)]/10 text-[var(--accent-light)] border border-[var(--accent)]/20"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] border border-transparent"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 py-4 border-t border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Store
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-[var(--border)] bg-[var(--bg-secondary)] hidden lg:flex flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25 }} className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border)] z-50 flex flex-col lg:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-[var(--border)]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold">Admin Panel</span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
