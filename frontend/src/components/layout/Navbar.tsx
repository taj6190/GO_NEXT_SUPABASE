"use client";

import api from "@/lib/api";
import { Category, Product } from "@/lib/types"; // Make sure Product is exported in your types
import { getProductImage } from "@/lib/utils";
import { useAuthStore, useCartStore, useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import {
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

  // Navigation & Menu States
  const [categories, setCategories] = useState<Category[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // AJAX Search States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Categories on mount
  useEffect(() => {
    api
      .get("/categories")
      .then(({ data }) => data.success && setCategories(data.data || []))
      .catch(() => {});
  }, []);

  // 2. Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    setShowCategories(false);
    setShowSearchDropdown(false);
  }, [pathname, setMobileMenuOpen]);

  // 3. Click outside handler for all dropdowns
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

  // 4. Debounce Search Input (Waits 300ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 5. Fetch Search Results
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
        // Adjust this endpoint/params based on your actual API structure
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
      {/* Premium Announcement Bar */}
      <div className="bg-zinc-900 text-white text-[11px] font-semibold py-1.5 z-50 relative">
        <div className="site-container flex items-center justify-center sm:justify-between">
          <span className="flex items-center gap-1.5 tracking-wide text-zinc-300">
            <Sparkles className="w-3 h-3 text-amber-400" /> Free Delivery on
            orders above ৳2,000
          </span>
          <Link
            href="/track"
            className="hidden sm:flex items-center gap-1 text-zinc-400 hover:text-white transition-colors tracking-wide uppercase text-[10px]"
          >
            <MapPin className="w-3 h-3" /> Track Order
          </Link>
        </div>
      </div>

      {/* Main Navbar - Compact & Clean */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm">
        {/* Top Tier: Branding, Search, Actions */}
        <div className="site-container flex items-center justify-between h-15 gap-6">
          {/* Logo & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="md:hidden flex items-center justify-center text-gray-800 -ml-2 p-2 focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-8 h-8 bg-black flex items-center justify-center group-hover:bg-[#ef4a23] transition-colors shadow-sm">
                <span className="text-white font-black text-lg leading-none">
                  G
                </span>
              </div>
              <span className="font-extrabold text-xl tracking-tight hidden sm:block text-gray-900">
                GoNext<span className="text-[#ef4a23]">.</span>
              </span>
            </Link>
          </div>

          {/* AJAX Search Bar (Desktop) */}
          <div className="flex-1 max-w-xl hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-[#ef4a23] transition-colors" />
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
                placeholder="Search products, brands, or categories..."
                className="w-full bg-gray-50 border border-transparent py-1.5 pl-9 pr-8 text-[13px] font-medium text-gray-800 outline-none focus:bg-white focus:border-[#ef4a23] focus:ring-1 focus:ring-[#ef4a23] transition-all placeholder:text-gray-400"
                autoComplete="off"
              />

              {/* Loader Icon */}
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                </div>
              )}

              {/* AJAX Dropdown */}
              <AnimatePresence>
                {showSearchDropdown && search.trim().length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-gray-100 shadow-xl overflow-hidden z-50 flex flex-col max-h-87.5"
                  >
                    <div className="overflow-y-auto py-1">
                      {isSearching && searchResults.length === 0 ? (
                        <div className="px-4 py-5 text-center text-[12px] text-gray-500 font-medium">
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          {searchResults.map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug}`}
                              onClick={() => {
                                setShowSearchDropdown(false);
                                setSearch("");
                              }}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
                            >
                              <Image
                                src={getProductImage(product)}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover bg-white border border-gray-100 p-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[12.5px] font-bold text-gray-800 truncate group-hover:text-[#ef4a23] transition-colors">
                                  {product.name}
                                </h4>
                                <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                                  ৳
                                  {Number(product.price).toLocaleString(
                                    "en-IN",
                                  )}
                                </p>
                              </div>
                            </Link>
                          ))}
                          <div className="bg-gray-50 border-t border-gray-100">
                            <button
                              type="submit"
                              className="w-full py-2.5 text-[11px] font-bold text-[#ef4a23] hover:text-black uppercase tracking-wide transition-colors text-center"
                            >
                              View all results for &quot;{search}&quot;
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="px-4 py-6 text-center text-[12px] text-gray-500 font-medium">
                          No products found for &quot;{search}&quot;
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => router.push("/products")}
              className="md:hidden flex items-center justify-center p-2 text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            <Link
              href="/wishlist"
              className="hidden sm:flex items-center justify-center p-2 text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <Heart className="w-4 h-4" />
            </Link>

            {/* Cart Icon */}
            <button
              onClick={toggleCart}
              className="relative flex items-center justify-center p-2 text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-1 right-0 w-3.75 h-3.75 bg-[#ef4a23] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* User Profile / Login */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center justify-center p-2 transition-colors ${showUserMenu ? "bg-gray-100 text-black" : "text-gray-800 hover:bg-gray-50"}`}
                >
                  <User className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[calc(100%+4px)] w-56 bg-white border border-gray-100 shadow-[0_10px_30px_rgb(0,0,0,0.08)] z-50 p-1 rounded-sm"
                    >
                      <div className="px-3 py-2.5 mb-1 bg-gray-50 border-b border-gray-100">
                        <p className="font-bold text-[13px] truncate text-gray-900">
                          {user?.full_name || "User Account"}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" /> My Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5" /> Wishlist
                      </Link>
                      {user?.role === "admin" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-[#ef4a23] hover:bg-red-50 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Admin Panel
                        </Link>
                      )}
                      <div className="h-px bg-gray-100 my-1 mx-2" />
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-black hover:bg-[#ef4a23] text-white py-1.5 px-4 text-[11px] font-bold tracking-wide uppercase transition-colors ml-1"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Tier: Category Bar (Desktop Only) */}
        {!isAdmin && (
          <div className="hidden md:block border-t border-gray-100 bg-gray-50/50">
            <div className="site-container flex items-center justify-between h-10.5">
              <div className="flex items-center gap-6 h-full">
                {/* Category Dropdown */}
                <div className="relative h-full flex items-center" ref={catRef}>
                  <button
                    onClick={() => setShowCategories(!showCategories)}
                    className={`flex items-center gap-2 h-full px-2 text-[12px] uppercase tracking-wide font-bold transition-colors ${showCategories ? "text-[#ef4a23]" : "text-gray-800 hover:text-[#ef4a23]"}`}
                  >
                    <Menu className="w-3.5 h-3.5" /> Categories
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-300 ${showCategories ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showCategories && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full w-64 bg-white border-x border-b border-gray-100 shadow-[0_10px_20px_rgb(0,0,0,0.05)] z-50 py-1 max-h-[60vh] overflow-y-auto"
                      >
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/products?category_id=${cat.id}`}
                            onClick={() => setShowCategories(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
                          >
                            {cat.image_url ? (
                              <Image
                                src={cat.image_url}
                                alt=""
                                width={24}
                                height={24}
                                className="w-6 h-6 object-contain filter grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100"
                              />
                            ) : (
                              <span className="w-6 h-6 bg-gray-100 flex items-center justify-center text-[10px]">
                                📦
                              </span>
                            )}
                            <span className="font-bold text-[12px] text-gray-700 group-hover:text-black">
                              {cat.name}
                            </span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Main Navigation Links */}
                <nav className="flex items-center gap-6 h-full">
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
                      className="text-[12px] font-bold text-gray-500 hover:text-black uppercase tracking-wide transition-colors flex items-center h-full border-b-2 border-transparent hover:border-black"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Extra Promo Link on Right Edge */}
              <Link
                href="/deals"
                className="text-[12px] font-bold text-[#ef4a23] hover:text-red-700 uppercase tracking-widest flex items-center h-full"
              >
                Today&apos;s Deals
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Off-Canvas Mobile Menu Drawer */}
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 md:hidden"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 bottom-0 left-0 w-[85%] max-w-[320px] bg-white z-101 flex flex-col shadow-2xl md:hidden overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="w-7 h-7 bg-black flex items-center justify-center">
                    <span className="text-white font-black text-sm">G</span>
                  </div>
                  <span className="font-extrabold text-lg tracking-tight text-gray-900">
                    GoNext<span className="text-[#ef4a23]">.</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-gray-500 hover:bg-gray-200 transition-colors rounded-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-5 pb-20">
                {/* Search Target */}
                <form onSubmit={handleSearchSubmit} className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search store..."
                      className="w-full bg-gray-50 border border-gray-200 py-2.5 pl-9 pr-4 text-[13px] font-medium outline-none focus:border-[#ef4a23] transition-colors"
                    />
                  </div>
                </form>

                {/* Primary Nav Links */}
                <div className="flex flex-col gap-1 mb-6 border-b border-gray-100 pb-6">
                  <Link
                    href="/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[14px] font-bold text-gray-900 py-2.5 hover:text-[#ef4a23]"
                  >
                    All Products
                  </Link>
                  <Link
                    href="/products?sort_by=created_at&sort_order=desc"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[14px] font-bold text-gray-900 py-2.5 hover:text-[#ef4a23]"
                  >
                    New Arrivals
                  </Link>
                  <Link
                    href="/deals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[14px] font-bold text-[#ef4a23] py-2.5"
                  >
                    Today&apos;s Deals
                  </Link>
                </div>

                {/* User & Utils */}
                <div className="flex flex-col gap-1 mb-8">
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 text-[13px] font-semibold text-gray-600 hover:text-black"
                  >
                    <Heart className="w-4 h-4" /> Wishlist
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 text-[13px] font-semibold text-gray-600 hover:text-black"
                  >
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
                  <Link
                    href="/track"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 text-[13px] font-semibold text-gray-600 hover:text-black"
                  >
                    <MapPin className="w-4 h-4" /> Track Order
                  </Link>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-1">
                      Categories
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products?category_id=${cat.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="py-2.5 px-1 text-[13.5px] font-semibold text-gray-700 hover:text-[#ef4a23] flex items-center justify-between group"
                        >
                          {cat.name}
                          <ChevronDown className="w-3 h-3 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              {!isAuthenticated && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 mt-auto">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full bg-black text-white text-center py-3 text-[13px] font-bold uppercase tracking-wider hover:bg-[#ef4a23] transition-colors"
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
