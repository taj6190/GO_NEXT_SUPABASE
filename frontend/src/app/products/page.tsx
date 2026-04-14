/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import ProductCard from "@/components/product/ProductCard";
import api from "@/lib/api";
import { Category, Product } from "@/lib/types";
import { useCategoryStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Grid3X3, List, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#ede9e2] last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-0 py-4 text-[11px] font-semibold tracking-[0.12em] text-[#1a1916] uppercase hover:text-[#c9a96e] transition-colors font-['DM_Sans',sans-serif]"
      >
        {title}
        <ChevronUp
          className={`w-3.5 h-3.5 text-[#9a9086] transition-transform duration-200 ${!open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [grid, setGrid] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { fetchCategories } = useCategoryStore();

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";
  const sortBy = searchParams.get("sort_by") || "created_at";
  const sortOrder = searchParams.get("sort_order") || "desc";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";

  useEffect(() => {
    const loadCategories = async () => {
      const cachedCats = await fetchCategories();
      setCategories(cachedCats);
    };
    loadCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "12",
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    if (search) params.set("search", search);
    if (categoryId) params.set("category_id", categoryId);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    api
      .get(`/products?${params}`)
      .then(({ data }) => {
        if (data.success) {
          setProducts(data.data || []);
          setTotal(data.meta?.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, categoryId, sortBy, sortOrder, minPrice, maxPrice]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/products?${params}`);
  };

  const clearFilters = () => {
    setShowFilters(false);
    router.push("/products");
  };

  const totalPages = Math.ceil(total / 12);
  const hasFilters = categoryId || minPrice || maxPrice || search;
  const currentCategory = categories.find((c) => c.id === categoryId);

  const SidebarContent = () => (
    <div className="font-['DM_Sans',sans-serif]">
      <FilterSection title="Categories">
        <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
          {[{ id: "", name: "All Categories" }, ...categories].map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span
                onClick={() => {
                  updateFilter("category_id", cat.id);
                  setShowFilters(false);
                }}
                className={`flex items-center gap-3 w-full text-[13px] transition-colors ${
                  categoryId === cat.id || (!categoryId && cat.id === "")
                    ? "text-[#c9a96e] font-semibold"
                    : "text-[#6b6258] group-hover:text-[#1a1916]"
                }`}
              >
                <span
                  className={`w-1 h-1 rounded-full shrink-0 transition-colors ${
                    categoryId === cat.id || (!categoryId && cat.id === "")
                      ? "bg-[#c9a96e]"
                      : "bg-[#e0dbd4]"
                  }`}
                />
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="flex gap-2.5 mb-4">
          <div className="flex-1">
            <label className="text-[9.5px] font-semibold tracking-widest uppercase text-[#9a9086] mb-1.5 block">
              Min
            </label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => updateFilter("min_price", e.target.value)}
              className="w-full text-[13px] text-[#1a1916] py-2 px-3 bg-white border border-[#ede9e2] outline-none focus:border-[#c9a96e] transition-colors placeholder:text-[#c4bcb2]"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9.5px] font-semibold tracking-widest uppercase text-[#9a9086] mb-1.5 block">
              Max
            </label>
            <input
              type="number"
              placeholder="∞"
              value={maxPrice}
              onChange={(e) => updateFilter("max_price", e.target.value)}
              className="w-full text-[13px] text-[#1a1916] py-2 px-3 bg-white border border-[#ede9e2] outline-none focus:border-[#c9a96e] transition-colors placeholder:text-[#c4bcb2]"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Under ৳1K", min: "", max: "1000" },
            { label: "৳1K–5K", min: "1000", max: "5000" },
            { label: "৳5K–20K", min: "5000", max: "20000" },
            { label: "৳20K+", min: "20000", max: "" },
          ].map((r) => (
            <button
              key={r.label}
              onClick={() => {
                const p = new URLSearchParams(searchParams.toString());
                p.set("min_price", r.min);
                p.set("max_price", r.max);
                p.set("page", "1");
                router.push(`/products?${p}`);
                setShowFilters(false);
              }}
              className="text-[10px] font-semibold text-[#6b6258] bg-[#faf8f5] border border-[#ede9e2] px-2.5 py-1.5 hover:border-[#c9a96e] hover:text-[#c9a96e] transition-colors"
            >
              {r.label}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div className="bg-[#faf8f5] min-h-screen font-['DM_Sans',sans-serif]">
      {/* Page header */}
      <div className="bg-[#1a1916] border-b border-[#2a2824]">
        <div className="site-container py-8 md:py-10">
          <p className="text-[#c9a96e] text-[10px] font-semibold tracking-[0.18em] uppercase mb-2 flex items-center gap-2">
            <span className="inline-block w-4 h-px bg-[#c9a96e]" />
            {currentCategory ? "Category" : search ? "Search" : "Catalogue"}
          </p>
          <h1 className="text-[clamp(1.8rem,4vw,3rem)] font-normal text-[#f5f0e8] font-['Instrument_Serif',serif] leading-tight">
            {currentCategory
              ? currentCategory.name
              : search
                ? `"${search}"`
                : "All Products"}
          </h1>
          <p className="text-[13px] text-[#6b6560] mt-1.5">{total} products</p>
        </div>
      </div>

      <div className="site-container py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          {/* Active filters */}
          {hasFilters ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold tracking-widest text-[#9a9086] uppercase">
                Filters:
              </span>
              {currentCategory && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1916] text-[#c9a96e] text-[11px] font-medium">
                  {currentCategory.name}
                  <button
                    onClick={() => updateFilter("category_id", "")}
                    className="text-[#6b6560] hover:text-[#c9a96e] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1916] text-[#c9a96e] text-[11px] font-medium">
                  &quot;{search}&quot;
                  <button
                    onClick={() => updateFilter("search", "")}
                    className="text-[#6b6560] hover:text-[#c9a96e] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1916] text-[#c9a96e] text-[11px] font-medium">
                  ৳{minPrice || "0"} – {maxPrice || "∞"}
                  <button
                    onClick={() => {
                      updateFilter("min_price", "");
                      updateFilter("max_price", "");
                    }}
                    className="text-[#6b6560] hover:text-[#c9a96e] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-[11px] font-semibold text-[#9a9086] hover:text-[#c9a96e] uppercase tracking-[0.08em] transition-colors ml-1"
              >
                Clear all
              </button>
            </div>
          ) : (
            <div />
          )}

          {/* Right controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 bg-white border border-[#ede9e2] px-3.5 py-2 hover:border-[#c9a96e] transition-colors text-[12px] font-semibold text-[#1a1916] md:hidden"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                const p = new URLSearchParams(searchParams.toString());
                p.set("sort_by", sb);
                p.set("sort_order", so);
                p.set("page", "1");
                router.push(`/products?${p}`);
              }}
              className="bg-white border border-[#ede9e2] py-2 pl-3 pr-8 text-[12px] font-medium text-[#1a1916] focus:outline-none focus:border-[#c9a96e] appearance-none transition-colors"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name-asc">Name: A–Z</option>
              <option value="average_rating-desc">Top Rated</option>
            </select>

            <div className="hidden sm:flex items-center border border-[#ede9e2] bg-white">
              <button
                onClick={() => setGrid(true)}
                className={`p-2 transition-colors ${grid ? "bg-[#1a1916] text-[#c9a96e]" : "text-[#9a9086] hover:text-[#1a1916]"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGrid(false)}
                className={`p-2 transition-colors ${!grid ? "bg-[#1a1916] text-[#c9a96e]" : "text-[#9a9086] hover:text-[#1a1916]"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* ── Desktop Sidebar ── */}
          <aside className="hidden md:block w-55 shrink-0">
            <div className="bg-white border border-[#ede9e2] p-5">
              <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#c9a96e] mb-4">
                Refine
              </p>
              <SidebarContent />
            </div>
          </aside>

          {/* ── Mobile Drawer ── */}
          <AnimatePresence>
            {showFilters && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                  className="fixed inset-0 bg-[#1a1916]/70 z-100 md:hidden"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed top-0 bottom-0 right-0 w-75 bg-[#faf8f5] z-101 shadow-2xl md:hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-5 py-4 bg-[#1a1916] border-b border-[#2a2824]">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[#c9a96e] uppercase">
                      Refine
                    </p>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-[#6b6560] hover:text-[#f5f0e8] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5">
                    <SidebarContent />
                  </div>
                  <div className="p-4 border-t border-[#ede9e2]">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full bg-[#c9a96e] hover:bg-[#b8944f] text-[#1a1916] py-3 text-[12px] font-semibold uppercase tracking-widest transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── Products Grid ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div
                className={`grid ${grid ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-4`}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white border border-[#ede9e2]"
                    style={{ height: grid ? "320px" : "140px" }}
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 bg-white border border-[#ede9e2]">
                <div className="text-4xl mb-4 opacity-30">◎</div>
                <h3 className="text-[18px] font-normal text-[#1a1916] font-['Instrument_Serif',serif] mb-2">
                  No products found
                </h3>
                <p className="text-[13px] text-[#9a9086] mb-8 font-light">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-[#1a1916] text-[#f5f0e8] hover:bg-[#c9a96e] hover:text-[#1a1916] px-8 py-3 text-[12px] font-semibold uppercase tracking-widest transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${categoryId}-${search}-${sortBy}-${page}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    className={`grid ${grid ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-4`}
                  >
                    {products.map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-12">
                <button
                  onClick={() =>
                    updateFilter("page", String(Math.max(1, page - 1)))
                  }
                  disabled={page === 1}
                  className="bg-white border border-[#ede9e2] px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-[#1a1916] disabled:opacity-30 hover:border-[#c9a96e] hover:text-[#c9a96e] transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => updateFilter("page", String(p))}
                      className={`w-9 h-9 flex items-center justify-center text-[12px] font-semibold transition-all ${
                        p === page
                          ? "bg-[#1a1916] text-[#c9a96e] border border-[#1a1916]"
                          : "bg-white border border-[#ede9e2] text-[#1a1916] hover:border-[#c9a96e] hover:text-[#c9a96e]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    updateFilter("page", String(Math.min(totalPages, page + 1)))
                  }
                  disabled={page === totalPages}
                  className="bg-white border border-[#ede9e2] px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-[#1a1916] disabled:opacity-30 hover:border-[#c9a96e] hover:text-[#c9a96e] transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#faf8f5] min-h-screen">
          <div className="bg-[#1a1916] h-32 animate-pulse" />
          <div className="site-container py-8 flex gap-8">
            <div className="hidden md:block w-55 h-96 animate-pulse bg-white border border-[#ede9e2]" />
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white border border-[#ede9e2] h-80"
                />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
