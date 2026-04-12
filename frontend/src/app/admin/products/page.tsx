"use client";

import api from "@/lib/api";
import { Product } from "@/lib/types";
import { formatPrice, getProductImage, hasVariants } from "@/lib/utils";
import { motion } from "framer-motion";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ NEW: selection state
  const [selected, setSelected] = useState<string[]>([]);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      search,
    });

    api
      .get(`/admin/products?${params}`)
      .then(({ data }) => {
        if (data.success) {
          setProducts(data.data || []);
          setTotal(data.meta?.total || 0);
        }
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchProducts]);

  // ---------------- SINGLE DELETE ----------------
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Product deleted");

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelected((prev) => prev.filter((i) => i !== id));
      setTotal((t) => t - 1);
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ---------------- TOGGLE ACTIVE ----------------
  const toggleActive = async (product: Product) => {
    try {
      await api.put(`/admin/products/${product.id}`, {
        is_active: !product.is_active,
      });

      toast.success(
        product.is_active ? "Product deactivated" : "Product activated"
      );

      fetchProducts();
    } catch {
      toast.error("Failed to update");
    }
  };

  // ---------------- SELECT ONE ----------------
  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  // ---------------- SELECT ALL ----------------
  const toggleSelectAll = () => {
    if (selected.length === products.length) {
      setSelected([]);
    } else {
      setSelected(products.map((p) => p.id));
    }
  };

  // ---------------- BULK DELETE ----------------
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;

    if (!confirm(`Delete ${selected.length} products?`)) return;

    try {
      await Promise.all(
        selected.map((id) =>
          api.delete(`/admin/products/${id}`)
        )
      );

      setProducts((prev) =>
        prev.filter((p) => !selected.includes(p.id))
      );

      setSelected([]);
      toast.success("Products deleted");
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="page-enter max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-bold">Products</h1>
          <p className="text-xs text-[var(--text-muted)]">{total} total</p>
        </div>

        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button onClick={handleBulkDelete} className="btn-secondary btn-sm text-xs">
              Delete ({selected.length})
            </button>
          )}

          <Link href="/admin/products/new" className="btn-primary btn-sm text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </Link>
        </div>
      </div>

      {loading && <p className="text-xs text-[var(--text-muted)] mb-2">Loading…</p>}

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name or SKU…"
          className="input-field pl-9 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
                <th className="p-2 w-10">
                  <input type="checkbox" checked={selected.length === products.length && products.length > 0} onChange={toggleSelectAll} />
                </th>
                <th className="text-left py-2 px-2 sm:px-3">Product</th>
                <th className="text-left py-2 px-2 sm:px-3 whitespace-nowrap">Price</th>
                <th className="text-left py-2 px-2 sm:px-3">Stock</th>
                <th className="text-left py-2 px-2 sm:px-3 hidden sm:table-cell">Type</th>
                <th className="text-left py-2 px-2 sm:px-3">Status</th>
                <th className="text-right py-2 px-2 sm:px-3 w-20"> </th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)]/60">
                  <td className="p-2 align-middle">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>

                  <td className="py-2 px-2 sm:px-3 align-middle">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden relative shrink-0">
                        <Image src={getProductImage(p)} alt="" fill className="object-cover" sizes="40px" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-snug truncate max-w-[200px] sm:max-w-xs">{p.name}</p>
                        <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-mono truncate">{p.sku}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-2 px-2 sm:px-3 align-middle whitespace-nowrap">{formatPrice(p.price)}</td>

                  <td className="py-2 px-2 sm:px-3 align-middle">{p.stock_quantity}</td>

                  <td className="py-2 px-2 sm:px-3 align-middle hidden sm:table-cell text-[var(--text-muted)]">{hasVariants(p) ? "Options" : "—"}</td>

                  <td className="py-2 px-2 sm:px-3 align-middle">
                    <button type="button" onClick={() => toggleActive(p)} className="text-xs underline-offset-2 hover:underline text-[var(--accent-light)]">
                      {p.is_active ? "Active" : "Off"}
                    </button>
                  </td>

                  <td className="py-2 px-2 sm:px-3 align-middle text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link href={`/admin/products/${p.id}`} className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]" aria-label="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button type="button" onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-md hover:bg-[var(--danger-bg)] text-[var(--danger)]" aria-label="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Prev
          </button>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
