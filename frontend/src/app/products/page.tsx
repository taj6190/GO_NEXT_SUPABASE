"use client";

import ProductCard from "@/components/product/ProductCard";
import api from "@/lib/api";
import { Category, Product } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Grid3X3, List, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function FilterSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white mb-[1px] shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 font-bold text-[14px] text-gray-800 hover:text-[#ef4a23] transition-colors"
      >
        {title}
        <ChevronUp className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${!open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
           <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "auto", opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="overflow-hidden"
           >
             <div className="px-4 pb-4 border-t border-gray-50 pt-3">
               {children}
             </div>
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

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category_id") || "";
  const sortBy = searchParams.get("sort_by") || "created_at";
  const sortOrder = searchParams.get("sort_order") || "desc";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";

  useEffect(() => {
    api.get("/categories").then(({ data }) => data.success && setCategories(data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "12", sort_by: sortBy, sort_order: sortOrder });
    if (search) params.set("search", search);
    if (categoryId) params.set("category_id", categoryId);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);

    api.get(`/products?${params}`).then(({ data }) => {
      if (data.success) { setProducts(data.data || []); setTotal(data.meta?.total || 0); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, search, categoryId, sortBy, sortOrder, minPrice, maxPrice]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
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
    <>
      <FilterSection title="Categories">
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          <label className="flex items-center gap-3 cursor-pointer group">
             <input type="radio" name="category" checked={!categoryId} onChange={() => updateFilter("category_id", "")} className="w-3.5 h-3.5 border-gray-300 text-[#ef4a23] focus:ring-[#ef4a23] cursor-pointer" />
             <span className={`text-[13px] transition-colors ${!categoryId ? "font-bold text-[#ef4a23]" : "text-gray-700 group-hover:text-[#ef4a23]"}`}>All Categories</span>
          </label>
          {categories.map((cat) => (
             <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="category" checked={categoryId === cat.id} onChange={() => { updateFilter("category_id", cat.id); setShowFilters(false); }} className="w-3.5 h-3.5 border-gray-300 text-[#ef4a23] focus:ring-[#ef4a23] cursor-pointer" />
                <span className={`text-[13px] transition-colors ${categoryId === cat.id ? "font-bold text-[#ef4a23]" : "text-gray-700 group-hover:text-[#ef4a23]"}`}>{cat.name}</span>
             </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        {/* Visual Slider */}
        <div className="relative h-1.5 mt-2 mb-6 bg-gray-200 rounded-full mx-2">
           <div className="absolute h-full bg-[#ef4a23] rounded-full" style={{ left: '0%', right: '0%' }} />
           <div className="absolute left-[0%] top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-white border-4 border-[#ef4a23] rounded-full shadow-sm cursor-pointer" />
           <div className="absolute right-[0%] top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-white border-4 border-[#ef4a23] rounded-full shadow-sm cursor-pointer" />
        </div>
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            placeholder="0"
            value={minPrice}
            onChange={(e) => updateFilter("min_price", e.target.value)}
            className="w-1/2 text-center text-[13px] font-medium py-1.5 border border-gray-300 outline-none focus:border-[#ef4a23]"
          />
          <input
            type="number"
            placeholder="279,999"
            value={maxPrice}
            onChange={(e) => updateFilter("max_price", e.target.value)}
            className="w-1/2 text-center text-[13px] font-medium py-1.5 border border-gray-300 outline-none focus:border-[#ef4a23]"
          />
        </div>

        {/* Quick Price Buttons */}
        <div className="flex flex-wrap gap-2 mt-2">
           {[
             { label: "Under ৳1K", min: "", max: "1000" },
             { label: "৳1K-5K", min: "1000", max: "5000" },
             { label: "৳5K-20K", min: "5000", max: "20000" },
             { label: "৳20K+", min: "20000", max: "" },
           ].map((r) => (
             <button key={r.label} onClick={() => {
               const params = new URLSearchParams(searchParams.toString());
               params.set("min_price", r.min); params.set("max_price", r.max); params.set("page", "1");
               router.push(`/products?${params}`);
               setShowFilters(false);
             }} className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1.5 border border-gray-200 hover:border-[#ef4a23] hover:text-[#ef4a23] transition-colors rounded-sm">
               {r.label}
             </button>
           ))}
        </div>
      </FilterSection>
    </>
  );

  return (
    <div className="bg-[#f2f4f8] min-h-screen mt-2">
      <div className="site-container py-8 page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 shadow-sm border border-gray-100">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {currentCategory ? currentCategory.name : search ? `Results for "${search}"` : "All Products"}
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">{total} products found</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 bg-gray-100 px-4 py-2 hover:bg-gray-200 transition-colors font-semibold text-[13px] text-gray-800 md:hidden border border-gray-200">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                const params = new URLSearchParams(searchParams.toString());
                params.set("sort_by", sb);
                params.set("sort_order", so);
                params.set("page", "1");
                router.push(`/products?${params}`);
              }}
              className="bg-gray-50 border border-gray-200 py-2 pl-3 pr-8 text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-[#ef4a23]"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="average_rating-desc">Top Rated</option>
            </select>
            <div className="hidden sm:flex items-center border border-gray-200 bg-gray-50 p-0.5">
              <button onClick={() => setGrid(true)} className={`p-1.5 transition-colors ${grid ? "bg-white shadow-sm border border-gray-200 text-black" : "text-gray-400"}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setGrid(false)} className={`p-1.5 transition-colors ${!grid ? "bg-white shadow-sm border border-gray-200 text-black" : "text-gray-400"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasFilters && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-[13px] font-bold text-gray-500">Active:</span>
            {currentCategory && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-[13px] font-bold text-gray-800 shadow-sm">
                {currentCategory.name}
                <button onClick={() => updateFilter("category_id", "")} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            {search && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-[13px] font-bold text-gray-800 shadow-sm">
                &quot;{search}&quot;
                <button onClick={() => updateFilter("search", "")} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-[13px] font-bold text-gray-800 shadow-sm">
                ৳{minPrice || "0"} - ৳{maxPrice || "∞"}
                <button onClick={() => { updateFilter("min_price", ""); updateFilter("max_price", ""); }} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-[12px] font-bold text-red-500 hover:underline uppercase tracking-wide ml-2">Clear all</button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-[240px] flex-shrink-0">
             {SidebarContent()}
          </aside>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {showFilters && (
              <>
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="fixed inset-0 bg-black/60 z-[100] md:hidden" />
                 <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed top-0 bottom-0 right-0 w-[300px] bg-[#f2f4f8] z-[101] shadow-2xl md:hidden overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm z-10">
                      <h3 className="font-extrabold text-[15px] uppercase tracking-wide text-gray-900">Filters</h3>
                      <button onClick={() => setShowFilters(false)} className="p-1 text-gray-500 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                      {SidebarContent()}
                    </div>
                    <div className="p-4 bg-white border-t border-gray-100">
                       <button onClick={clearFilters} className="w-full bg-[#ef4a23] text-white py-3 text-[13px] font-bold uppercase tracking-wide hover:bg-black transition-colors">Apply Filters</button>
                    </div>
                 </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className={`grid ${grid ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-3`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white border border-gray-100" style={{ aspectRatio: grid ? "auto" : "4/1", height: grid ? "320px" : "140px" }} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 shadow-sm">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold mb-2">No products found</h3>
                <p className="text-gray-500 text-[13px] mb-6">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="bg-black text-white px-6 py-2.5 text-[13px] font-bold uppercase tracking-wide hover:bg-[#ef4a23] transition-colors">Clear Filters</button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={`${categoryId}-${search}-${sortBy}-${page}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={`grid ${grid ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-3`}>
                    {products.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-10">
                <button onClick={() => updateFilter("page", String(Math.max(1, page - 1)))} disabled={page === 1} className="bg-white border border-gray-200 px-3 py-1.5 text-[12px] font-bold disabled:opacity-40 hover:bg-gray-50">
                  PREV
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button key={p} onClick={() => updateFilter("page", String(p))} className={`w-8 h-8 flex items-center justify-center text-[13px] font-bold transition-all ${p === page ? "bg-[#ef4a23] text-white border border-[#ef4a23]" : "bg-white border border-gray-200 hover:border-gray-400"}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => updateFilter("page", String(Math.min(totalPages, page + 1)))} disabled={page === totalPages} className="bg-white border border-gray-200 px-3 py-1.5 text-[12px] font-bold disabled:opacity-40 hover:bg-gray-50">
                  NEXT
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
    <Suspense fallback={
      <div className="bg-[#f2f4f8] min-h-screen py-8">
        <div className="site-container">
           <div className="animate-pulse h-12 w-full bg-white mb-6 border border-gray-100" />
           <div className="flex gap-6">
              <div className="hidden md:block w-[240px] animate-pulse h-[600px] bg-white border border-gray-100" />
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse bg-white border border-gray-100 h-80" />)}
              </div>
           </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
