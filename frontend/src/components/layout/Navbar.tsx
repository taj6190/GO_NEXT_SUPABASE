"use client";

import api from "@/lib/api";
import { Category, Product } from "@/lib/types";
import { getProductImage } from "@/lib/utils";
import {
  useAuthStore,
  useCartStore,
  useCategoryStore,
  useUIStore,
} from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
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

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface CatWithChildren extends Category {
  children?: Category[];
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { toggleCart, mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } =
    useUIStore();

  // data
  const [categories, setCategories] = useState<CatWithChildren[]>([]);
  const { fetchCategories } = useCategoryStore();

  // desktop mega-menu
  const [megaOpen, setMegaOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<CatWithChildren | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // desktop search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── MOBILE: search takeover ──
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState("");
  const [mobileDebounced, setMobileDebounced] = useState("");
  const [mobileResults, setMobileResults] = useState<Product[]>([]);
  const [mobileSearching, setMobileSearching] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // user menu
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ─── fetch categories with caching ───
  useEffect(() => {
    const loadCategories = async () => {
      const cachedCats = await fetchCategories();
      setCategories(cachedCats as CatWithChildren[]);
    };
    loadCategories();
  }, [fetchCategories]);

  // ─── close everything on route change ───
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    setMegaOpen(false);
    setShowSearchDrop(false);
    setMobileSearchOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // ─── outside click handlers ───
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      )
        setShowUserMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSearchDrop(false);
      if (megaRef.current && !megaRef.current.contains(e.target as Node))
        setMegaOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ─── desktop search debounce + fetch ───
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 280);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    if (debouncedSearch.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDrop(false);
      return;
    }
    const run = async () => {
      setIsSearching(true);
      setShowSearchDrop(true);
      try {
        const { data } = await api.get(
          `/products?search=${encodeURIComponent(debouncedSearch)}&limit=6`,
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

  // ─── mobile search debounce + fetch ───
  useEffect(() => {
    const t = setTimeout(() => setMobileDebounced(mobileQuery), 280);
    return () => clearTimeout(t);
  }, [mobileQuery]);
  useEffect(() => {
    if (mobileDebounced.trim().length < 2) {
      setMobileResults([]);
      return;
    }
    const run = async () => {
      setMobileSearching(true);
      try {
        const { data } = await api.get(
          `/products?search=${encodeURIComponent(mobileDebounced)}&limit=8`,
        );
        if (data.success) setMobileResults(data.data || []);
      } catch {
        setMobileResults([]);
      } finally {
        setMobileSearching(false);
      }
    };
    run();
  }, [mobileDebounced]);

  // ─── open mobile search and auto-focus ───
  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    setMobileQuery("");
    setMobileResults([]);
    setTimeout(() => mobileInputRef.current?.focus(), 80);
  };

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setMobileQuery("");
    setMobileResults([]);
  };

  const handleDesktopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setShowSearchDrop(false);
      router.push(`/products?search=${encodeURIComponent(search)}`);
    }
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileQuery.trim()) {
      closeMobileSearch();
      router.push(`/products?search=${encodeURIComponent(mobileQuery)}`);
    }
  };

  // ─── mega-menu hover helpers (300ms delay on leave) ───
  const handleCatEnter = (cat: CatWithChildren) => {
    clearTimeout(hoverTimer.current);
    setHoveredCat(cat);
    setMegaOpen(true);
  };
  const handleMegaLeave = () => {
    hoverTimer.current = setTimeout(() => {
      setMegaOpen(false);
      setHoveredCat(null);
    }, 200);
  };
  const handleMegaEnter = () => {
    clearTimeout(hoverTimer.current);
  };

  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {/* ═══════════════════════════════════
          ANNOUNCEMENT BAR
      ═══════════════════════════════════ */}
      <div className="bg-[#1a1916] border-b border-[#2a2824] ">
        <div className="site-container flex items-center justify-center sm:justify-between py-2.5">
          <div className="flex items-center gap-2">
            <Zap
              className="w-3 h-3 text-[#c9a96e] flex-shrink-0"
              fill="currentColor"
            />
            <span className="text-[11px] font-medium tracking-[0.05em] text-[#a09a8e]">
              Free shipping on orders above{" "}
              <span className="text-[#c9a96e] font-semibold">৳2,000</span>
            </span>
          </div>
          <Link
            href="/track"
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium tracking-[0.1em] uppercase text-[#6b6560] hover:text-[#c9a96e] transition-colors group"
          >
            <MapPin className="w-3 h-3" />
            Track Order
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════
          MAIN HEADER
      ═══════════════════════════════════ */}
      <header className="sticky top-0 z-40 w-full ">
        {/* ── PRIMARY ROW ── */}
        <div className="relative bg-[#faf8f5] border-b border-[#ede9e2]">
          <div className="site-container">
            <div className="flex items-center h-[66px] gap-4">
              {/* Mobile hamburger */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2.5 group flex-shrink-0"
              >
                <div className="w-9 h-9 bg-[#1a1916] flex items-center justify-center group-hover:bg-[#c9a96e] transition-colors duration-300 flex-shrink-0">
                  <span className="text-[#c9a96e] group-hover:text-[#1a1916] font-semibold text-[15px] transition-colors [font-family:'Instrument_Serif',serif]">
                    S
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="block text-[20px] font-normal leading-none text-[#1a1916] [font-family:'Instrument_Serif',serif]">
                    ShopVerse
                  </span>
                  <span className="block text-[9px] font-medium tracking-[0.18em] uppercase text-[#c9a96e] mt-0.5">
                    Bangladesh
                  </span>
                </div>
              </Link>

              {/* ── DESKTOP SEARCH ── */}
              <div className="flex-1 max-w-2xl hidden md:block" ref={searchRef}>
                <form onSubmit={handleDesktopSearch} className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#b0a898] group-focus-within:text-[#c9a96e] transition-colors pointer-events-none z-10" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (e.target.value.trim().length > 1)
                        setShowSearchDrop(true);
                    }}
                    onFocus={() => {
                      if (search.trim().length > 1) setShowSearchDrop(true);
                    }}
                    placeholder="Search products, brands, categories…"
                    autoComplete="off"
                    className="w-full h-11 bg-white border border-[#e8e2d9] pl-10 pr-4 text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none focus:border-[#c9a96e] focus:ring-[3px] focus:ring-[#c9a96e]/10 transition-all"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#b0a898] animate-spin" />
                  )}

                  {/* Desktop search dropdown */}
                  <AnimatePresence>
                    {showSearchDrop && search.trim().length > 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#ede9e2] shadow-[0_16px_48px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
                      >
                        {isSearching && searchResults.length === 0 ? (
                          <div className="px-5 py-6 text-center">
                            <Loader2 className="w-5 h-5 text-[#b0a898] animate-spin mx-auto mb-1.5" />
                            <p className="text-[12px] text-[#9a9086]">
                              Searching…
                            </p>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <>
                            {searchResults.map((product) => (
                              <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                onClick={() => {
                                  setShowSearchDrop(false);
                                  setSearch("");
                                }}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#faf8f5] transition-colors group border-b border-[#f5f1eb] last:border-0"
                              >
                                <div className="relative w-10 h-10 bg-[#faf8f5] border border-[#ede9e2] flex-shrink-0">
                                  <Image
                                    src={getProductImage(product)}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-1"
                                    sizes="40px"
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
                                <ArrowRight className="w-3.5 h-3.5 text-[#c4bcb2] group-hover:text-[#c9a96e] flex-shrink-0 transition-colors" />
                              </Link>
                            ))}
                            <button
                              type="submit"
                              className="w-full py-2.5 text-[11px] font-semibold text-[#c9a96e] hover:bg-[#faf8f5] uppercase tracking-[0.1em] transition-colors border-t border-[#ede9e2] flex items-center justify-center gap-1.5"
                            >
                              View all results{" "}
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="px-5 py-6 text-center">
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

              {/* ── MOBILE SEARCH ICON (triggers takeover) ── */}
              <button
                onClick={openMobileSearch}
                className="md:hidden p-2.5 text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors ml-auto"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* ── ACTION ICONS ── */}
              <div className="hidden md:flex items-center gap-0.5 ml-2">
                <Link
                  href="/wishlist"
                  className="p-2.5 text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </Link>

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
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#c9a96e] text-[#1a1916] text-[9px] font-bold flex items-center justify-center"
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
                      className={`p-2.5 transition-colors ${showUserMenu ? "bg-[#1a1916] text-[#c9a96e]" : "text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3]"}`}
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.14 }}
                          className="absolute right-0 top-[calc(100%+6px)] w-60 bg-white border border-[#ede9e2] shadow-[0_16px_48px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
                        >
                          <div className="bg-[#1a1916] px-4 py-3">
                            <p className="text-[14px] font-normal text-[#f5f0e8] [font-family:'Instrument_Serif',serif] truncate">
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
                                <Icon className="w-4 h-4" />
                                {label}
                                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 text-[#c9a96e] transition-opacity" />
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
                    className="ml-1 bg-[#1a1916] hover:bg-[#c9a96e] text-[#f5f0e8] hover:text-[#1a1916] px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition-all duration-200"
                  >
                    Sign In
                  </Link>
                )}
              </div>

              {/* Mobile: cart + user */}
              <div className="flex md:hidden items-center gap-0.5">
                <button
                  onClick={toggleCart}
                  className="relative p-2.5 text-[#6b6258]"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-[#c9a96e] text-[#1a1916] text-[9px] font-bold flex items-center justify-center">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECONDARY NAV — desktop categories mega-menu trigger row ── */}
        {!isAdmin && (
          <div
            className="hidden md:block bg-white border-b border-[#ede9e2]"
            ref={megaRef}
          >
            <div className="site-container">
              <div className="flex items-center h-11 gap-8">
                {/* All Categories trigger */}
                <button
                  onMouseEnter={() => {
                    clearTimeout(hoverTimer.current);
                    setMegaOpen(true);
                    if (!hoveredCat && categories.length)
                      setHoveredCat(categories[0]);
                  }}
                  onMouseLeave={handleMegaLeave}
                  className={`flex items-center gap-2 h-11 text-[11px] font-semibold tracking-[0.1em] uppercase border-b-2 transition-colors flex-shrink-0 ${megaOpen ? "text-[#c9a96e] border-[#c9a96e]" : "text-[#6b6258] hover:text-[#1a1916] border-transparent"}`}
                >
                  <Menu className="w-3.5 h-3.5" />
                  All Categories
                </button>

                {/* Nav links */}
                <nav className="flex items-center gap-7">
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
                      className={`h-11 flex items-center text-[11px] font-semibold tracking-[0.1em] uppercase border-b-2 transition-all ${pathname === link.href ? "text-[#c9a96e] border-[#c9a96e]" : "text-[#6b6258] hover:text-[#1a1916] border-transparent"}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <Link
                  href="/deals"
                  className="ml-auto flex-shrink-0 hidden lg:flex items-center gap-2 bg-[#1a1916] hover:bg-[#c9a96e] text-[#c9a96e] hover:text-[#1a1916] px-4 py-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition-all duration-200"
                >
                  <Zap className="w-3 h-3" fill="currentColor" />
                  Flash Deals
                </Link>
              </div>
            </div>

            {/* ══════════════════════════════════════
                DESKTOP MEGA-MENU
                Left sidebar: category list
                Right panel: subcategory columns
            ══════════════════════════════════════ */}
            <AnimatePresence>
              {megaOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={handleMegaEnter}
                  onMouseLeave={handleMegaLeave}
                  className="absolute left-0 right-0 top-full bg-white border-t border-[#ede9e2] shadow-[0_16px_48px_rgba(0,0,0,0.12)] z-50"
                  style={{ maxHeight: "480px" }}
                >
                  <div className="site-container">
                    <div className="flex" style={{ height: "480px" }}>
                      {/* Left: Category list */}
                      <div className="w-[220px] flex-shrink-0 border-r border-[#f0ebe3] overflow-y-auto py-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onMouseEnter={() => handleCatEnter(cat)}
                            onClick={() => {
                              router.push(`/products?category_id=${cat.id}`);
                              setMegaOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors group ${hoveredCat?.id === cat.id ? "bg-[#faf8f5] text-[#1a1916]" : "text-[#6b6258] hover:bg-[#faf8f5] hover:text-[#1a1916]"}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {cat.image_url ? (
                                <Image
                                  src={cat.image_url}
                                  alt=""
                                  width={22}
                                  height={22}
                                  className="w-[22px] h-[22px] object-contain flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                                />
                              ) : (
                                <span className="w-[22px] h-[22px] flex items-center justify-center text-sm flex-shrink-0 opacity-50">
                                  📦
                                </span>
                              )}
                              <span className="text-[12.5px] font-medium truncate">
                                {cat.name}
                              </span>
                            </div>
                            {/* Gold left border when active */}
                            <ChevronRight
                              className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${hoveredCat?.id === cat.id ? "text-[#c9a96e]" : "text-[#d4cfc9]"}`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Right: Subcategory mega panel */}
                      <div className="flex-1 overflow-y-auto p-6">
                        {hoveredCat && (
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={hoveredCat.id}
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              {/* Panel header */}
                              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f0ebe3]">
                                <div className="flex items-center gap-2.5">
                                  {hoveredCat.image_url && (
                                    <Image
                                      src={hoveredCat.image_url}
                                      alt=""
                                      width={28}
                                      height={28}
                                      className="w-7 h-7 object-contain opacity-80"
                                    />
                                  )}
                                  <h3 className="text-[16px] font-normal text-[#1a1916] [font-family:'Instrument_Serif',serif]">
                                    {hoveredCat.name}
                                  </h3>
                                </div>
                                <Link
                                  href={`/products?category_id=${hoveredCat.id}`}
                                  onClick={() => setMegaOpen(false)}
                                  className="text-[11px] font-semibold text-[#c9a96e] hover:text-[#1a1916] uppercase tracking-[0.1em] transition-colors flex items-center gap-1"
                                >
                                  View All <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>

                              {/* Subcategories grid — 4 columns */}
                              {hoveredCat.children &&
                              hoveredCat.children.length > 0 ? (
                                <div className="grid grid-cols-4 gap-x-6 gap-y-1">
                                  {hoveredCat.children.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      href={`/products?category_id=${sub.id}`}
                                      onClick={() => setMegaOpen(false)}
                                      className="flex items-center gap-1.5 py-1.5 text-[12px] font-medium text-[#6b6258] hover:text-[#c9a96e] transition-colors group"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-[#ede9e2] group-hover:bg-[#c9a96e] transition-colors flex-shrink-0" />
                                      <span className="truncate">
                                        {sub.name}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                /* No subcategories — show a browse prompt */
                                <div className="flex flex-col items-start gap-3 py-4">
                                  <p className="text-[13px] text-[#9a9086] font-light">
                                    Browse all products in this category
                                  </p>
                                  <Link
                                    href={`/products?category_id=${hoveredCat.id}`}
                                    onClick={() => setMegaOpen(false)}
                                    className="inline-flex items-center gap-2 bg-[#1a1916] hover:bg-[#c9a96e] text-[#f5f0e8] hover:text-[#1a1916] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all duration-200"
                                  >
                                    Shop {hoveredCat.name}{" "}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════
          MOBILE SEARCH TAKEOVER
          — full header replacement, Startech-style
      ═══════════════════════════════════ */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 inset-x-0 z-[200] md:hidden bg-[#faf8f5] border-b border-[#ede9e2] shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
          >
            {/* Search input row */}
            <form
              onSubmit={handleMobileSearch}
              className="flex items-center h-[66px] px-3 gap-2"
            >
              {/* Back button */}
              <button
                type="button"
                onClick={closeMobileSearch}
                className="p-2.5 text-[#6b6258] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors flex-shrink-0"
                aria-label="Close search"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0a898] pointer-events-none" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={mobileQuery}
                  onChange={(e) => setMobileQuery(e.target.value)}
                  placeholder="Search products, brands…"
                  autoComplete="off"
                  className="w-full h-11 bg-white border border-[#e8e2d9] pl-9 pr-9 text-[14px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none focus:border-[#c9a96e] focus:ring-[2px] focus:ring-[#c9a96e]/10 transition-all"
                />
                {mobileQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileQuery("");
                      setMobileResults([]);
                      mobileInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#b0a898] hover:text-[#6b6258] p-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search submit */}
              <button
                type="submit"
                className="flex-shrink-0 w-10 h-11 bg-[#1a1916] hover:bg-[#c9a96e] flex items-center justify-center transition-colors duration-200"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-[#c9a96e] hover:text-[#1a1916]" />
              </button>
            </form>

            {/* Results panel — appears below input */}
            <div
              className="border-t border-[#f0ebe3] overflow-y-auto"
              style={{ maxHeight: "calc(100svh - 66px)" }}
            >
              {mobileQuery.trim().length > 1 && (
                <>
                  {mobileSearching ? (
                    <div className="flex items-center justify-center gap-2 py-8">
                      <Loader2 className="w-5 h-5 text-[#b0a898] animate-spin" />
                      <span className="text-[13px] text-[#9a9086]">
                        Searching…
                      </span>
                    </div>
                  ) : mobileResults.length > 0 ? (
                    <ul>
                      {mobileResults.map((product) => (
                        <li
                          key={product.id}
                          className="border-b border-[#f5f1eb] last:border-0"
                        >
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={closeMobileSearch}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf8f5] active:bg-[#f0ebe3] transition-colors group"
                          >
                            <div className="relative w-12 h-12 flex-shrink-0 bg-[#faf8f5] border border-[#ede9e2]">
                              <Image
                                src={getProductImage(product)}
                                alt={product.name}
                                fill
                                className="object-contain p-1"
                                sizes="48px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-[#1a1916] group-hover:text-[#c9a96e] transition-colors line-clamp-2 leading-snug">
                                {product.name}
                              </p>
                              <p className="text-[12px] font-semibold text-[#1a1916] mt-1">
                                ৳{Number(product.price).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#c4bcb2] flex-shrink-0" />
                          </Link>
                        </li>
                      ))}
                      {/* View all */}
                      <li>
                        <button
                          onClick={() => {
                            closeMobileSearch();
                            router.push(
                              `/products?search=${encodeURIComponent(mobileQuery)}`,
                            );
                          }}
                          className="w-full flex items-center justify-center gap-2 py-4 text-[12px] font-semibold text-[#c9a96e] uppercase tracking-[0.1em] hover:bg-[#faf8f5] transition-colors"
                        >
                          View all results for &ldquo;{mobileQuery}&rdquo;
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    </ul>
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-[14px] text-[#9a9086]">
                        No results for &ldquo;{mobileQuery}&rdquo;
                      </p>
                      <p className="text-[12px] text-[#c4bcb2] mt-1 font-light">
                        Try a different search term
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Fallback: show categories when no query */}
              {mobileQuery.trim().length < 2 && categories.length > 0 && (
                <div className="p-4">
                  <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#c9a96e] mb-3">
                    Browse Categories
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.slice(0, 9).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category_id=${cat.id}`}
                        onClick={closeMobileSearch}
                        className="flex flex-col items-center gap-1.5 p-2.5 bg-white border border-[#ede9e2] hover:border-[#c9a96e] transition-colors group text-center"
                      >
                        {cat.image_url ? (
                          <Image
                            src={cat.image_url}
                            alt={cat.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                        <span className="text-[10px] font-medium text-[#6b6258] group-hover:text-[#1a1916] line-clamp-2 leading-tight">
                          {cat.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════
          MOBILE SLIDE-OUT DRAWER
      ═══════════════════════════════════ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#1a1916]/70 z-[100] md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 bottom-0 left-0 w-[88%] max-w-[340px] bg-[#faf8f5] z-[101] flex flex-col shadow-2xl md:hidden "
            >
              {/* Drawer header */}
              <div className="bg-[#1a1916] px-5 py-4 flex items-center justify-between flex-shrink-0">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 bg-[#c9a96e] flex items-center justify-center">
                    <span className="text-[#1a1916] font-semibold text-[14px] [font-family:'Instrument_Serif',serif]">
                      S
                    </span>
                  </div>
                  <div>
                    <span className="block text-[17px] font-normal text-[#f5f0e8] [font-family:'Instrument_Serif',serif] leading-none">
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
                {/* Primary nav */}
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
                      <Icon className="w-4 h-4 flex-shrink-0" />
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
                        className="flex items-center gap-2.5 py-2.5 text-[13px] font-medium text-[#6b6258] hover:text-[#1a1916] border-b border-[#f0ebe3] last:border-0 transition-colors"
                      >
                        {cat.image_url ? (
                          <Image
                            src={cat.image_url}
                            alt=""
                            width={18}
                            height={18}
                            className="w-[18px] h-[18px] object-contain opacity-60 flex-shrink-0"
                          />
                        ) : (
                          <span className="w-[18px] text-sm opacity-50 flex-shrink-0">
                            📦
                          </span>
                        )}
                        <span className="flex-1">{cat.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#c4bcb2]" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isAuthenticated && (
                <div className="p-4 border-t border-[#ede9e2] flex-shrink-0">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full bg-[#1a1916] hover:bg-[#c9a96e] text-[#f5f0e8] hover:text-[#1a1916] text-center py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-all duration-200"
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
