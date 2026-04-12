/* eslint-disable react/no-unescaped-entities */
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
  ShoppingCart,
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
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      setShowSearchDropdown(true);
      try {
        const { data } = await api.get(
          `/products?search=${encodeURIComponent(debouncedSearch)}&limit=5`,
        );
        if (data.success) {
          setSearchResults(data.data || []);
        }
      } catch (error) {
        console.error("Search failed", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
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
      {/* Premium Announcement Bar - Bold Design */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        className="relative bg-linear-to-r from-zinc-900 via-neutral-800 to-zinc-900 text-white overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px)] bg-size-[24px] opacity-30" />
        <div className="site-container relative z-10 flex items-center justify-center sm:justify-between py-2.5">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Zap
                className="w-3.5 h-3.5 text-amber-400 animate-pulse"
                fill="currentColor"
              />
              <div className="absolute inset-0 blur-sm">
                <Zap
                  className="w-3.5 h-3.5 text-amber-400"
                  fill="currentColor"
                />
              </div>
            </div>
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase">
              Free shipping on orders above{" "}
              <span className="text-amber-400 font-black">৳2,000</span>
            </span>
          </div>
          <Link
            href="/track"
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-400 hover:text-white transition-all group"
          >
            <MapPin className="w-3 h-3 group-hover:animate-bounce" />
            Track Order
            <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </Link>
        </div>
      </motion.div>

      {/* Main Navbar - Redesigned with Bold Typography */}
      <header className="sticky top-0 z-40 w-full bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        {/* Primary Navigation Row */}
        <div className="site-container">
          <div className="flex items-center justify-between h-18 gap-6">
            {/* Mobile Menu + Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMobileMenu}
                className="md:hidden -ml-2 p-2.5 hover:bg-neutral-50 active:scale-95 transition-all group"
              >
                <Menu
                  className="w-5 h-5 text-neutral-700 group-hover:text-black transition-colors"
                  strokeWidth={2.5}
                />
              </button>

              <Link href="/" className="flex items-center gap-3 group">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6, ease: "backOut" }}
                  className="relative w-10 h-10 bg-black group-hover:bg-linear-to-br group-hover:from-[#ef4a23] group-hover:to-[#d63516] transition-all shadow-lg"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent" />
                  <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xl">
                    G
                  </span>
                </motion.div>
                <div className="hidden sm:block">
                  <span className="block text-2xl font-black tracking-tight text-black leading-none">
                    GoNext
                  </span>
                  <span className="block text-[9px] font-bold tracking-[0.15em] uppercase text-neutral-400 -mt-0.5">
                    Commerce
                  </span>
                </div>
              </Link>
            </div>

            {/* Enhanced Search Bar */}
            <div className="flex-1 max-w-2xl hidden md:block" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative group">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-[#ef4a23] transition-colors z-10"
                    strokeWidth={2.5}
                  />
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
                    placeholder="Search products, brands, categories..."
                    className="w-full h-12 bg-neutral-50 border-2 border-transparent pl-11 pr-12 text-sm font-semibold text-black outline-none focus:bg-white focus:border-[#ef4a23] transition-all placeholder:text-neutral-400 placeholder:font-medium"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2
                        className="w-4 h-4 text-neutral-400 animate-spin"
                        strokeWidth={2.5}
                      />
                    </div>
                  )}
                </div>

                {/* Enhanced AJAX Dropdown */}
                <AnimatePresence>
                  {showSearchDropdown && search.trim().length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white border-2 border-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden z-50 max-h-120"
                    >
                      <div className="overflow-y-auto">
                        {isSearching && searchResults.length === 0 ? (
                          <div className="px-6 py-12 text-center">
                            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin mx-auto mb-3" />
                            <p className="text-sm font-semibold text-neutral-500">
                              Searching...
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
                                className="flex items-center gap-4 px-4 py-3.5 hover:bg-neutral-50 transition-all group border-b border-neutral-100 last:border-0"
                              >
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="relative"
                                >
                                  <Image
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    width={56}
                                    height={56}
                                    className="w-14 h-14 object-cover bg-white border-2 border-neutral-100 group-hover:border-[#ef4a23] transition-all"
                                  />
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-black group-hover:text-[#ef4a23] transition-colors line-clamp-1">
                                    {product.name}
                                  </h4>
                                  <p className="text-xs font-black text-neutral-600 mt-1">
                                    ৳
                                    {Number(product.price).toLocaleString(
                                      "en-IN",
                                    )}
                                  </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-[#ef4a23] group-hover:translate-x-1 transition-all" />
                              </Link>
                            ))}
                            <button
                              type="submit"
                              className="w-full py-4 text-xs font-black text-[#ef4a23] hover:text-white hover:bg-[#ef4a23] uppercase tracking-[0.12em] transition-all border-t-2 border-neutral-100 flex items-center justify-center gap-2 group"
                            >
                              View all results
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </>
                        ) : (
                          <div className="px-6 py-12 text-center">
                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Search className="w-7 h-7 text-neutral-400" />
                            </div>
                            <p className="text-sm font-bold text-neutral-600">
                              No products found for &quot;{search}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Action Icons - Redesigned */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => router.push("/products")}
                className="md:hidden p-2.5 hover:bg-neutral-50 active:scale-95 transition-all"
              >
                <Search
                  className="w-5 h-5 text-neutral-700"
                  strokeWidth={2.5}
                />
              </button>

              <Link
                href="/wishlist"
                className="hidden sm:flex p-2.5 hover:bg-neutral-50 active:scale-95 transition-all group relative"
              >
                <Heart
                  className="w-5 h-5 text-neutral-700 group-hover:text-[#ef4a23] group-hover:fill-[#ef4a23] transition-all"
                  strokeWidth={2.5}
                />
              </Link>

              <button
                onClick={toggleCart}
                className="relative p-2.5 hover:bg-neutral-50 active:scale-95 transition-all group"
              >
                <ShoppingCart
                  className="w-5 h-5 text-neutral-700 group-hover:text-[#ef4a23] transition-colors"
                  strokeWidth={2.5}
                />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-linear-to-br from-[#ef4a23] to-[#d63516] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg"
                    >
                      {itemCount > 99 ? "99+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`p-2.5 transition-all active:scale-95 ${
                      showUserMenu
                        ? "bg-black text-white"
                        : "hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <User className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+8px)] w-72 bg-white border-2 border-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-50 overflow-hidden"
                      >
                        <div className="bg-linear-to-br from-neutral-900 to-black px-5 py-4 text-white">
                          <p className="font-black text-base truncate">
                            {user?.full_name || "User Account"}
                          </p>
                          <p className="text-xs text-neutral-400 truncate mt-1 font-medium">
                            {user?.email}
                          </p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/orders"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-neutral-700 hover:text-black hover:bg-neutral-50 transition-all group"
                          >
                            <Package className="w-4 h-4" strokeWidth={2.5} />
                            My Orders
                            <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </Link>
                          <Link
                            href="/wishlist"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-neutral-700 hover:text-black hover:bg-neutral-50 transition-all group"
                          >
                            <Heart className="w-4 h-4" strokeWidth={2.5} />
                            Wishlist
                            <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </Link>
                          {user?.role === "admin" && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-3 py-2.5 text-sm font-black text-[#ef4a23] hover:bg-red-50 transition-all group"
                            >
                              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                              Admin Panel
                              <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Link>
                          )}
                        </div>
                        <div className="border-t-2 border-neutral-100 p-2">
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-black text-red-600 hover:bg-red-50 transition-all w-full group"
                          >
                            <LogOut className="w-4 h-4" strokeWidth={2.5} />
                            Sign Out
                            <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="ml-2 bg-black hover:bg-linear-to-r hover:from-[#ef4a23] hover:to-[#d63516] text-white px-5 py-2.5 text-xs font-black tracking-[0.08em] uppercase transition-all active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Navigation Bar - Categories & Links */}
        {!isAdmin && (
          <div className="border-t-2 border-neutral-100">
            <div className="site-container">
              <div className="flex items-center justify-between h-14">
                <div className="flex items-center gap-8">
                  {/* Category Mega Menu */}
                  <div className="relative" ref={catRef}>
                    <button
                      onClick={() => setShowCategories(!showCategories)}
                      className={`flex items-center gap-2.5 h-14 px-1 text-xs font-black uppercase tracking-widest transition-all border-b-3 ${
                        showCategories
                          ? "text-[#ef4a23] border-[#ef4a23]"
                          : "text-neutral-600 hover:text-black border-transparent"
                      }`}
                    >
                      <Menu className="w-4 h-4" strokeWidth={2.5} />
                      Categories
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                          showCategories ? "rotate-180" : ""
                        }`}
                        strokeWidth={2.5}
                      />
                    </button>

                    <AnimatePresence>
                      {showCategories && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full w-80 bg-white border-2 border-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,0.12)] z-50 max-h-125 overflow-y-auto"
                        >
                          {categories.map((cat, idx) => (
                            <Link
                              key={cat.id}
                              href={`/products?category_id=${cat.id}`}
                              onClick={() => setShowCategories(false)}
                              className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-all group border-b border-neutral-100 last:border-0"
                            >
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                              >
                                {cat.image_url ? (
                                  <Image
                                    src={cat.image_url}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 object-contain grayscale group-hover:grayscale-0 transition-all"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-neutral-100 flex items-center justify-center text-sm">
                                    📦
                                  </div>
                                )}
                              </motion.div>
                              <span className="font-bold text-sm text-neutral-700 group-hover:text-black flex-1">
                                {cat.name}
                              </span>
                              <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-[#ef4a23] group-hover:translate-x-1 transition-all" />
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Main Navigation Links */}
                  <nav className="hidden md:flex items-center gap-8">
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
                        className={`text-xs font-black uppercase tracking-widest h-14 flex items-center border-b-3 transition-all ${
                          pathname === link.href
                            ? "text-[#ef4a23] border-[#ef4a23]"
                            : "text-neutral-600 hover:text-black border-transparent"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Deals Badge */}
                <Link
                  href="/deals"
                  className="hidden lg:flex items-center gap-2 bg-linear-to-r from-[#ef4a23] to-[#d63516] text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all group"
                >
                  <Zap
                    className="w-3.5 h-3.5 group-hover:animate-pulse"
                    fill="currentColor"
                  />
                  Today's Deals
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Drawer - Redesigned */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-100 md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 bottom-0 left-0 w-[90%] max-w-90 bg-white z-101 flex flex-col shadow-2xl md:hidden"
            >
              {/* Drawer Header */}
              <div className="relative bg-linear-to-br from-neutral-900 to-black px-5 py-5 border-b-2 border-neutral-800">
                <div className="flex items-center justify-between">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3"
                  >
                    <div className="w-9 h-9 bg-white flex items-center justify-center">
                      <span className="text-black font-black text-lg">G</span>
                    </div>
                    <div>
                      <span className="block text-xl font-black tracking-tight text-white leading-none">
                        GoNext
                      </span>
                      <span className="block text-[8px] font-bold tracking-[0.15em] uppercase text-neutral-400 -mt-0.5">
                        Commerce
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-white hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <X className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="overflow-y-auto flex-1 p-5">
                {/* Mobile Search */}
                <form onSubmit={handleSearchSubmit} className="mb-6">
                  <div className="relative">
                    <Search
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
                      strokeWidth={2.5}
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products..."
                      className="w-full h-12 bg-neutral-50 border-2 border-neutral-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#ef4a23] transition-all"
                    />
                  </div>
                </form>

                {/* Primary Links */}
                <div className="space-y-1 mb-6 pb-6 border-b-2 border-neutral-100">
                  <Link
                    href="/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-3 text-base font-black text-neutral-900 hover:bg-neutral-50 transition-all group"
                  >
                    All Products
                    <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-[#ef4a23] group-hover:translate-x-1 transition-all" />
                  </Link>
                  <Link
                    href="/products?sort_by=created_at&sort_order=desc"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-3 text-base font-black text-neutral-900 hover:bg-neutral-50 transition-all group"
                  >
                    New Arrivals
                    <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-[#ef4a23] group-hover:translate-x-1 transition-all" />
                  </Link>
                  <Link
                    href="/deals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-3 bg-linear-to-r from-[#ef4a23] to-[#d63516] text-white hover:shadow-lg transition-all group"
                  >
                    <span className="font-black text-base">Today's Deals</span>
                    <Zap className="w-4 h-4" fill="currentColor" />
                  </Link>
                </div>

                {/* Utility Links */}
                <div className="space-y-1 mb-8">
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-neutral-600 hover:text-black hover:bg-neutral-50 transition-all"
                  >
                    <Heart className="w-4 h-4" strokeWidth={2.5} />
                    Wishlist
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-neutral-600 hover:text-black hover:bg-neutral-50 transition-all"
                  >
                    <Package className="w-4 h-4" strokeWidth={2.5} />
                    My Orders
                  </Link>
                  <Link
                    href="/track"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-neutral-600 hover:text-black hover:bg-neutral-50 transition-all"
                  >
                    <MapPin className="w-4 h-4" strokeWidth={2.5} />
                    Track Order
                  </Link>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-neutral-400 tracking-[0.12em] uppercase mb-3 px-3">
                      Browse Categories
                    </h4>
                    <div className="space-y-0.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products?category_id=${cat.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 text-sm font-bold text-neutral-700 hover:text-black hover:bg-neutral-50 transition-all group"
                        >
                          {cat.name}
                          <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-neutral-300 group-hover:text-[#ef4a23] group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {!isAuthenticated && (
                <div className="border-t-2 border-neutral-100 p-5 bg-neutral-50">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full bg-black hover:bg-linear-to-r hover:from-[#ef4a23] hover:to-[#d63516] text-white text-center py-3.5 text-sm font-black uppercase tracking-[0.08em] transition-all active:scale-95 shadow-lg"
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
