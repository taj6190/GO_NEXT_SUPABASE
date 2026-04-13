/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import api from "@/lib/api";
import { Category, Product } from "@/lib/types";
import { getProductImage } from "@/lib/utils";
import { useAuthStore, useCartStore, useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { toggleCart, mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } =
    useUIStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get("/categories")
      .then(({ data }) => data.success && setCategories(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    setShowCategories(false);
    setShowSearchDropdown(false);
  }, [pathname, setMobileMenuOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      )
        setShowUserMenu(false);
      if (catRef.current && !catRef.current.contains(e.target as Node))
        setShowCategories(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSearchDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const run = async () => {
      setIsSearching(true);
      setShowSearchDropdown(true);
      try {
        const { data } = await api.get(
          `/products?search=${encodeURIComponent(debouncedSearch)}&limit=5`,
        );
        if (data.success) setSearchResults(data.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    run();
  }, [debouncedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setShowSearchDropdown(false);
      router.push(`/products?search=${encodeURIComponent(search)}`);
    }
  };

  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="bg-[#1a1916] border-b border-[#2a2824] font-['DM_Sans',sans-serif]">
        <div className="site-container flex items-center justify-center sm:justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Zap
              className="w-3 h-3 text-[#c9a96e] shrink-0"
              fill="currentColor"
            />
            <span className="text-[11px] font-medium tracking-[0.06em] text-[#a09a8e]">
              Free shipping on orders above{" "}
              <span className="text-[#c9a96e] font-semibold">৳2,000</span>
            </span>
          </div>
          <Link
            href="/track"
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase text-[#6b6560] hover:text-[#c9a96e] transition-colors group"
          >
            <MapPin className="w-3 h-3" />
            Track Order
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>

      {/* ── MAIN HEADER ── */}
      <header className="sticky top-0 z-40 w-full bg-[#faf8f5] border-b border-[#ede9e2] font-['DM_Sans',sans-serif]">
        {/* Primary row */}
        <div className="site-container">
          <div className="flex items-center justify-between h-17 gap-6">
            {/* Mobile menu trigger + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link href="/" className="flex items-center gap-3 group shrink-0">
                <div className="w-9 h-9 bg-[#1a1916] flex items-center justify-center shrink-0 group-hover:bg-[#c9a96e] transition-colors duration-300">
                  <span className="text-[#c9a96e] group-hover:text-[#1a1916] font-semibold text-[15px] transition-colors font-['Instrument_Serif',serif]">
                    S
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="block text-[20px] font-normal leading-none text-[#1a1916] font-['Instrument_Serif',serif]">
                    ShopVerse
                  </span>
                  <span className="block text-[9px] font-medium tracking-[0.18em] uppercase text-[#c9a96e] mt-0.5">
                    Bangladesh
                  </span>
                </div>
              </Link>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl hidden md:block" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.75 h-3.75 text-[#b0a898] group-focus-within:text-[#c9a96e] transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value.trim().length > 1)
                      setShowSearchDropdown(true);
                  }}
                  onFocus={() => {
                    if (search.trim().length > 1) setShowSearchDropdown(true);
                  }}
                  placeholder="Search products, brands, categories…"
                  autoComplete="off"
                  className="w-full h-11 bg-white border border-[#e8e2d9] pl-10 pr-10 text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none focus:border-[#c9a96e] focus:ring-[3px] focus:ring-[#c9a96e]/10 transition-all font-['DM_Sans',sans-serif]"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.75 h-3.75 text-[#b0a898] animate-spin" />
                )}

                {/* Search dropdown */}
                <AnimatePresence>
                  {showSearchDropdown && search.trim().length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#ede9e2] shadow-[0_16px_48px_rgba(0,0,0,0.1)] overflow-hidden z-50"
                    >
                      {isSearching && searchResults.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <Loader2 className="w-5 h-5 text-[#b0a898] animate-spin mx-auto mb-2" />
                          <p className="text-[12px] text-[#9a9086]">
                            Searching…
                          </p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          {searchResults.map((product, idx) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug}`}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setSearch("");
                              }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf8f5] transition-colors group border-b border-[#f0ebe3] last:border-0"
                            >
                              <div className="relative w-11 h-11 bg-[#faf8f5] border border-[#ede9e2] shrink-0">
                                <Image
                                  src={getProductImage(product)}
                                  alt={product.name}
                                  fill
                                  className="object-contain p-1"
                                  sizes="44px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-[#1a1916] group-hover:text-[#c9a96e] transition-colors line-clamp-1">
                                  {product.name}
                                </p>
                                <p className="text-[11px] text-[#9a9086] mt-0.5">
                                  ৳
                                  {Number(product.price).toLocaleString(
                                    "en-IN",
                                  )}
                                </p>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-[#c4bcb2] group-hover:text-[#c9a96e] transition-colors shrink-0" />
                            </Link>
                          ))}
                          <button
                            type="submit"
                            className="w-full py-3 text-[11px] font-semibold text-[#c9a96e] hover:bg-[#faf8f5] uppercase tracking-widest transition-colors border-t border-[#ede9e2] flex items-center justify-center gap-1.5"
                          >
                            View all results <ArrowRight className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="px-5 py-8 text-center">
                          <p className="text-[13px] text-[#9a9086]">
                            No results for &ldquo;{search}&rdquo;
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              {/* Mobile search */}
              <button
                onClick={() => router.push("/products")}
                className="md:hidden p-2.5 text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="hidden sm:flex p-2.5 text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative p-2.5 text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 bg-[#c9a96e] text-[#1a1916] text-[9px] font-bold flex items-center justify-center"
                    >
                      {itemCount > 99 ? "99+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`p-2.5 transition-colors ${showUserMenu ? "bg-[#1a1916] text-[#c9a96e]" : "text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3]"}`}
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+6px)] w-64 bg-white border border-[#ede9e2] shadow-[0_16px_48px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
                      >
                        {/* User header */}
                        <div className="bg-[#1a1916] px-4 py-3.5">
                          <p className="text-[14px] font-normal text-[#f5f0e8] truncate font-['Instrument_Serif',serif]">
                            {user?.full_name || "My Account"}
                          </p>
                          <p className="text-[11px] text-[#6b6560] truncate mt-0.5">
                            {user?.email}
                          </p>
                        </div>
                        <div className="p-1.5">
                          {[
                            {
                              href: "/orders",
                              icon: Package,
                              label: "My Orders",
                            },
                            {
                              href: "/wishlist",
                              icon: Heart,
                              label: "Wishlist",
                            },
                          ].map(({ href, icon: Icon, label }) => (
                            <Link
                              key={href}
                              href={href}
                              className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#6b6258] hover:text-[#1a1916] hover:bg-[#faf8f5] transition-colors group"
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              {label}
                              <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#c9a96e]" />
                            </Link>
                          ))}
                          {user?.role === "admin" && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#c9a96e] hover:bg-[#faf8f5] transition-colors group"
                            >
                              <Sparkles className="w-4 h-4" />
                              Admin Panel
                              <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-[#ede9e2] p-1.5">
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#b87878] hover:text-[#991b1b] hover:bg-[#fef2f2] transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="ml-2 bg-[#1a1916] hover:bg-[#c9a96e] text-[#f5f0e8] hover:text-[#1a1916] px-5 py-2.5 text-[11px] font-semibold tracking-widest uppercase transition-all duration-200 font-['DM_Sans',sans-serif]"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Secondary nav — categories + links */}
        {!isAdmin && (
          <div className="border-t border-[#ede9e2] bg-white">
            <div className="site-container">
              <div className="flex items-center justify-between h-11">
                <div className="flex items-center gap-8">
                  {/* Category dropdown */}
                  <div className="relative" ref={catRef}>
                    <button
                      onClick={() => setShowCategories(!showCategories)}
                      className={`flex items-center gap-2 h-11 text-[11px] font-semibold tracking-widest uppercase transition-colors border-b-2 ${
                        showCategories
                          ? "text-[#c9a96e] border-[#c9a96e]"
                          : "text-[#6b6258] hover:text-[#1a1916] border-transparent"
                      }`}
                    >
                      <Menu className="w-3.5 h-3.5" />
                      Categories
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${showCategories ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {showCategories && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full w-72 bg-white border border-[#ede9e2] shadow-[0_16px_48px_rgba(0,0,0,0.1)] z-50 max-h-120 overflow-y-auto"
                        >
                          {/* Gold top accent */}
                          <div className="h-0.5 bg-[#c9a96e]" />
                          {categories.map((cat, idx) => (
                            <div key={cat.id}>
                              <div className="flex items-center border-b border-[#f0ebe3] last:border-0">
                                <Link
                                  href={`/products?category_id=${cat.id}`}
                                  onClick={() => setShowCategories(false)}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf8f5] transition-colors group flex-1"
                                >
                                  {cat.image_url ? (
                                    <Image
                                      src={cat.image_url}
                                      alt=""
                                      width={28}
                                      height={28}
                                      className="w-7 h-7 object-contain opacity-70 group-hover:opacity-100 transition-opacity shrink-0"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 bg-[#f0ebe3] flex items-center justify-center text-sm shrink-0">
                                      📦
                                    </div>
                                  )}
                                  <span className="text-[13px] font-medium text-[#6b6258] group-hover:text-[#1a1916] transition-colors flex-1">
                                    {cat.name}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#c4bcb2] group-hover:text-[#c9a96e] transition-colors" />
                                </Link>
                                {cat.children && cat.children.length > 0 && (
                                  <button
                                    onClick={() =>
                                      setExpandedCategory(
                                        expandedCategory === cat.id
                                          ? null
                                          : cat.id,
                                      )
                                    }
                                    className="px-3 py-3 border-l border-[#f0ebe3] text-[#9a9086] hover:text-[#c9a96e] hover:bg-[#faf8f5] transition-colors"
                                  >
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedCategory === cat.id ? "rotate-180" : ""}`}
                                    />
                                  </button>
                                )}
                              </div>
                              <AnimatePresence>
                                {expandedCategory === cat.id &&
                                  cat.children?.length && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.18 }}
                                      className="overflow-hidden bg-[#faf8f5]"
                                    >
                                      {cat.children.map((sub) => (
                                        <Link
                                          key={sub.id}
                                          href={`/products?category_id=${sub.id}`}
                                          onClick={() =>
                                            setShowCategories(false)
                                          }
                                          className="flex items-center gap-2.5 pl-11 pr-4 py-2.5 text-[12px] font-medium text-[#9a9086] hover:text-[#c9a96e] hover:bg-white transition-colors border-b border-[#ede9e2] last:border-0"
                                        >
                                          <span className="w-1 h-1 rounded-full bg-[#c9a96e] shrink-0 opacity-60" />
                                          {sub.name}
                                        </Link>
                                      ))}
                                    </motion.div>
                                  )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Nav links */}
                  <nav className="hidden md:flex items-center gap-7">
                    {[
                      { href: "/products", label: "All Products" },
                      {
                        href: "/products?sort_by=created_at&sort_order=desc",
                        label: "New Arrivals",
                      },
                      { href: "/products?featured=true", label: "Featured" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`h-11 flex items-center text-[11px] font-semibold tracking-widest uppercase border-b-2 transition-all ${
                          pathname === link.href
                            ? "text-[#c9a96e] border-[#c9a96e]"
                            : "text-[#6b6258] hover:text-[#1a1916] border-transparent"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Flash Deals CTA */}
                <Link
                  href="/deals"
                  className="hidden lg:flex items-center gap-2 bg-[#1a1916] hover:bg-[#c9a96e] text-[#c9a96e] hover:text-[#1a1916] px-4 py-2 text-[10px] font-semibold tracking-[0.12em] uppercase transition-all duration-200"
                >
                  <Zap className="w-3 h-3" fill="currentColor" />
                  Flash Deals
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#1a1916]/70 z-100 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 bottom-0 left-0 w-[88%] max-w-85 bg-[#faf8f5] z-101 flex flex-col shadow-2xl md:hidden font-['DM_Sans',sans-serif]"
            >
              {/* Drawer header */}
              <div className="bg-[#1a1916] px-5 py-4 flex items-center justify-between shrink-0">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-[#c9a96e] flex items-center justify-center">
                    <span className="text-[#1a1916] font-semibold text-[14px] font-['Instrument_Serif',serif]">
                      S
                    </span>
                  </div>
                  <div>
                    <span className="block text-[18px] font-normal text-[#f5f0e8] font-['Instrument_Serif',serif] leading-none">
                      ShopVerse
                    </span>
                    <span className="block text-[8px] font-medium tracking-[0.16em] uppercase text-[#c9a96e] mt-0.5">
                      Bangladesh
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#6b6560] hover:text-[#f5f0e8] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 py-4">
                {/* Mobile search */}
                <form onSubmit={handleSearchSubmit} className="px-4 mb-5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0a898] pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products…"
                      className="w-full h-11 bg-white border border-[#e8e2d9] pl-9 pr-4 text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </div>
                </form>

                {/* Primary links */}
                <div className="px-4 pb-4 mb-2 border-b border-[#ede9e2]">
                  {[
                    { href: "/products", label: "All Products" },
                    {
                      href: "/products?sort_by=created_at&sort_order=desc",
                      label: "New Arrivals",
                    },
                    { href: "/products?featured=true", label: "Featured" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-3 text-[14px] font-medium text-[#1a1916] hover:text-[#c9a96e] border-b border-[#f0ebe3] last:border-0 transition-colors"
                    >
                      {link.label}
                      <ArrowRight className="w-3.5 h-3.5 text-[#c4bcb2]" />
                    </Link>
                  ))}
                  <Link
                    href="/deals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3 text-[14px] font-semibold text-[#c9a96e] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" fill="currentColor" />
                      Flash Deals
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Utility links */}
                <div className="px-4 pb-4 mb-2 border-b border-[#ede9e2]">
                  {[
                    { href: "/wishlist", icon: Heart, label: "Wishlist" },
                    { href: "/orders", icon: Package, label: "My Orders" },
                    { href: "/track", icon: MapPin, label: "Track Order" },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2.5 text-[13px] font-medium text-[#6b6258] hover:text-[#1a1916] transition-colors"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div className="px-4">
                    <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#c9a96e] mb-3">
                      Categories
                    </p>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category_id=${cat.id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between py-2.5 text-[13px] font-medium text-[#6b6258] hover:text-[#1a1916] border-b border-[#f0ebe3] last:border-0 transition-colors"
                      >
                        {cat.name}
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-[#c4bcb2]" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer footer */}
              {!isAuthenticated && (
                <div className="p-4 border-t border-[#ede9e2] shrink-0">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full bg-[#1a1916] hover:bg-[#c9a96e] text-[#f5f0e8] hover:text-[#1a1916] text-center py-3.5 text-[12px] font-semibold uppercase tracking-widest transition-all duration-200"
                  >
                    Sign In / Register
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
