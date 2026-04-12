"use client";

import api from "@/lib/api";
import { Category } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/categories")
      .then(({ data }) => {
        if (data.success) setCategories(data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="site-container py-8">
        <div className="skeleton h-8 w-48 mb-6 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="site-container py-8 page-enter">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">All Categories</h1>

      {categories.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--text-muted)] text-lg">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category_id=${cat.id}`}
              className="glass-card p-6 flex flex-col items-center text-center group hover:border-[var(--brand)]/30 transition-all"
            >
              {cat.image_url ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden relative mb-4 shadow-sm">
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center text-3xl mb-4">
                  ✨
                </div>
              )}
              <h3 className="font-semibold group-hover:text-[var(--brand)] transition-colors">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                  {cat.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
