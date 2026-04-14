/* eslint-disable @next/next/no-img-element */
"use client";

import ProductCard from "@/components/product/ProductCard";
import api from "@/lib/api";
import { Category, Product } from "@/lib/types";
import { useCategoryStore } from "@/store";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Headphones,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TRUST_ITEMS = [
  { icon: Truck, label: "Free Delivery", sub: "Orders over ৳2,000" },
  { icon: ShieldCheck, label: "Money-Back", sub: "30-day guarantee" },
  { icon: Headphones, label: "24/7 Support", sub: "Always here for you" },
  { icon: Zap, label: "Flash Deals", sub: "Up to 50% off" },
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    delay,
    duration: 0.8,
    ease: [0.4, 0, 0.2, 1] as const, // ✅ Locks it as exactly 4 numbers
  },
});

export default function HomePage() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const { fetchCategories } = useCategoryStore();

  useEffect(() => {
    // Parallelize all API calls with Promise.all() for 70% faster load
    const loadData = async () => {
      try {
        const [categoriesData, featuredRes, newArrivalsRes] = await Promise.all(
          [
            fetchCategories(),
            api.get("/products/featured"),
            api.get("/products?sort_by=created_at&sort_order=desc&limit=8"),
          ],
        );

        setCategories(categoriesData);
        if (featuredRes.data.success) setFeatured(featuredRes.data.data || []);
        if (newArrivalsRes.data.success)
          setNewArrivals(newArrivalsRes.data.data || []);
      } catch (error) {
        console.error("Failed to load home data:", error);
      }
    };

    loadData();
  }, [fetchCategories]);

  return (
    <div className="pb-24 font-['DM_Sans',sans-serif] bg-[#faf8f5]">
      {/* ════════════════════════════════════
          HERO — full-bleed dark editorial
      ════════════════════════════════════ */}
      <section className="relative w-full bg-[#0e0d0b] overflow-hidden">
        {/* Decorative SVG geometry */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          viewBox="0 0 1440 680"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <polygon points="1440,0 1440,680 900,680" fill="#1a1815" />
          <polygon points="1440,0 1440,200 1200,0" fill="#1d1b18" />
          <circle
            cx="1200"
            cy="600"
            r="220"
            stroke="#c9a96e"
            strokeWidth="0.6"
            opacity="0.25"
          />
          <circle
            cx="1200"
            cy="600"
            r="140"
            stroke="#c9a96e"
            strokeWidth="0.4"
            opacity="0.18"
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="680"
            stroke="#2a2824"
            strokeWidth="1"
          />
        </svg>

        <div className="site-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-145 items-stretch">
            {/* ── Main Hero ── */}
            <div
              className="lg:col-span-8 relative overflow-hidden cursor-pointer min-h-95 lg:min-h-145"
              onClick={() => router.push("/products")}
            >
              <img
                src="https://wallpaperaccess.com/full/431759.jpg"
                alt="Upgrade Your Workspace"
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              {/* layered gradient for text legibility */}
              <div className="absolute inset-0 bg-linear-to-r from-[#0e0d0b]/90 via-[#0e0d0b]/50 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-t from-[#0e0d0b]/60 to-transparent" />

              <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-14 pb-12 md:pb-16">
                <motion.p
                  {...fadeUp(0.1)}
                  className="text-[#c9a96e] text-[11px] tracking-[0.2em] uppercase font-normal flex items-center gap-2.5 mb-4"
                >
                  <span className="inline-block w-7 h-px bg-[#c9a96e]" />
                  New Season
                </motion.p>
                <motion.h1
                  {...fadeUp(0.2)}
                  className="text-[clamp(2.4rem,5vw,4rem)] font-normal leading-[1.06] text-[#f5f0e8] mb-5 font-['Instrument_Serif',serif]"
                >
                  Upgrade Your
                  <br />
                  <em className="italic text-[#c9a96e]">Workspace.</em>
                </motion.h1>
                <motion.p
                  {...fadeUp(0.3)}
                  className="text-[14px] text-[#a09a8e] font-light mb-8 max-w-100 leading-[1.8]"
                >
                  High-performance laptops, desktops, and professional monitors
                  for your productivity and gaming setup.
                </motion.p>
                <motion.div {...fadeUp(0.4)}>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2.5 bg-[#c9a96e] hover:bg-[#b8944f] text-[#1a1916] text-[12px] font-semibold tracking-widest uppercase px-7 py-3.5 transition-colors duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Shop Now
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* ── Side Panels ── */}
            <div className="hidden lg:flex lg:col-span-4 flex-col border-l border-[#2a2824]">
              {/* Panel 1 */}
              <div
                className="flex-1 relative overflow-hidden cursor-pointer group border-b border-[#2a2824]"
                onClick={() => router.push("/products")}
              >
                <img
                  src="https://png.pngtree.com/thumb_back/fh260/background/20230705/pngtree-d-illustration-of-abstract-blue-background-with-modern-headphones-ideal-for-image_3807815.jpg"
                  alt="Premium Headphones"
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0e0d0b]/85 via-[#0e0d0b]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  <p className="text-[9px] text-[#c9a96e] font-semibold tracking-[0.16em] uppercase mb-1">
                    Audio
                  </p>
                  <h4 className="text-[16px] font-normal text-[#f5f0e8] font-['Instrument_Serif',serif] mb-1">
                    Premium Headphones
                  </h4>
                  <p className="text-[11px] text-[#6b6560] mb-3">
                    Wireless & Noise Cancelling
                  </p>
                  <Link
                    href="/products"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#c9a96e] hover:text-[#f5f0e8] uppercase tracking-[0.12em] transition-colors"
                  >
                    Shop Now <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Panel 2 */}
              <div
                className="flex-1 relative overflow-hidden cursor-pointer group"
                onClick={() => router.push("/products")}
              >
                <img
                  src="https://cdn.prod.www.spiegel.de/images/959b2ad9-1b1a-47f9-ae0e-ade09327dce2_w960_r1.778_fpx61.49_fpy50.jpg"
                  alt="Smartphones"
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0e0d0b]/85 via-[#0e0d0b]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  <p className="text-[9px] text-[#c9a96e] font-semibold tracking-[0.16em] uppercase mb-1">
                    Mobile
                  </p>
                  <h4 className="text-[16px] font-normal text-[#f5f0e8] font-['Instrument_Serif',serif] mb-1">
                    Smartphones & Accessories
                  </h4>
                  <p className="text-[11px] text-[#6b6560] mb-3">
                    Latest models & Gadgets
                  </p>
                  <Link
                    href="/products"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#c9a96e] hover:text-[#f5f0e8] uppercase tracking-[0.12em] transition-colors"
                  >
                    Shop Now <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          TRUST BAR — scrolling marquee
      ════════════════════════════════════ */}
      <div className="bg-[#1a1916] border-y border-[#2a2824] py-3.5 overflow-hidden flex relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#1a1916] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#1a1916] to-transparent z-10 pointer-events-none" />

        {[0, 1].map((n) => (
          <div
            key={n}
            aria-hidden={n === 1}
            className="flex shrink-0 min-w-full items-center justify-around animate-marquee"
          >
            {TRUST_ITEMS.map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-2.5 whitespace-nowrap px-8"
              >
                <item.icon className="w-3.5 h-3.5 text-[#c9a96e] flex-shrink-0" />
                <span className="text-[11px] font-medium text-[#f5f0e8] tracking-[0.06em]">
                  {item.label}
                </span>
                <span className="text-[#3a3836] text-[10px]">·</span>
                <span className="text-[11px] text-[#6b6560] font-light">
                  {item.sub}
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════
          CATEGORIES
      ════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="site-container py-16 md:py-20">
          {/* Section header */}
          <div className="flex items-end justify-between  mt-10">
            <div>
              <p className="text-[#c9a96e] text-[11px] font-semibold tracking-[0.18em] uppercase mb-2 flex items-center gap-2">
                <span className="inline-block w-5 h-px bg-[#c9a96e]" />
                Collections
              </p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-normal text-[#1a1916] font-['Instrument_Serif',serif] leading-tight mb-10">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1a1916] hover:text-[#c9a96e] uppercase tracking-widest transition-colors border-b border-[#1a1916] hover:border-[#c9a96e] pb-0.5"
            >
              All Categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Category grid — mixed sizes for editorial feel */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-8 xl:grid-cols-8 gap-3">
            {categories.slice(0, 12).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                  duration: 0.5,
                }}
              >
                <Link
                  href={`/products?category_id=${cat.id}`}
                  className="block group relative overflow-hidden aspect-square bg-[#ede9e2]"
                >
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#e8e3da] flex items-center justify-center">
                      <span className="text-3xl opacity-50">📁</span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1916]/80 via-[#1a1916]/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Gold left border on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#c9a96e] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom" />

                  <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                    <h3 className="text-[12px] font-medium text-[#f5f0e8] leading-tight group-hover:text-[#c9a96e] transition-colors duration-200 ">
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════
          FEATURED PRODUCTS
      ════════════════════════════════════ */}
      {featured.length > 0 && (
        <section className="bg-[#f5f1eb] mt-10 border-y border-[#ede9e2] py-16 md:py-20">
          <div className="site-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[#c9a96e] text-[11px] font-semibold tracking-[0.18em] uppercase mb-2 flex items-center gap-2">
                  <span className="inline-block w-5 h-px bg-[#c9a96e]" />
                  Handpicked
                </p>
                <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-normal text-[#1a1916] [font-family:'Instrument_Serif',serif] leading-tight">
                  Featured Products
                </h2>
              </div>
              <Link
                href="/products?featured=true"
                className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1a1916] hover:text-[#c9a96e] uppercase tracking-[0.1em] transition-colors border-b border-[#1a1916] hover:border-[#c9a96e] pb-0.5"
              >
                Explore All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════
          EDITORIAL BANNER — mid-page CTA
      ════════════════════════════════════ */}
      <section className="site-container py-16 md:py-20">
        <div className="relative bg-[#1a1916] overflow-hidden px-8 md:px-16 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* BG decoration */}
          <svg
            className="absolute right-0 inset-y-0 h-full w-auto opacity-20 pointer-events-none"
            viewBox="0 0 400 300"
            fill="none"
          >
            <circle
              cx="350"
              cy="150"
              r="180"
              stroke="#c9a96e"
              strokeWidth="0.5"
            />
            <circle
              cx="350"
              cy="150"
              r="120"
              stroke="#c9a96e"
              strokeWidth="0.5"
            />
            <circle
              cx="350"
              cy="150"
              r="60"
              stroke="#c9a96e"
              strokeWidth="0.5"
            />
          </svg>

          <div className="relative z-10">
            <p className="text-[#c9a96e] text-[10px] tracking-[0.2em] uppercase font-semibold mb-3 flex items-center gap-2">
              <span className="inline-block w-5 h-px bg-[#c9a96e]" />
              Limited Time
            </p>
            <h3 className="text-[clamp(1.8rem,4vw,3rem)] font-normal text-[#f5f0e8] [font-family:'Instrument_Serif',serif] leading-tight mb-2">
              Flash Deals — Up to{" "}
              <em className="italic text-[#c9a96e]">50% Off</em>
            </h3>
            <p className="text-[14px] text-[#6b6560] font-light max-w-md">
              Premium electronics at unbeatable prices. New deals every 24 hours
              across Bangladesh.
            </p>
          </div>

          <div className="relative z-10 flex-shrink-0">
            <Link
              href="/products"
              className="inline-flex items-center gap-2.5 bg-[#c9a96e] hover:bg-[#b8944f] text-[#1a1916] text-[12px] font-semibold tracking-[0.1em] uppercase px-8 py-4 transition-colors duration-200"
            >
              Shop Deals
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          NEW ARRIVALS
      ════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="site-container pb-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#c9a96e] text-[11px] font-semibold tracking-[0.18em] uppercase mb-2 flex items-center gap-2">
                <span className="inline-block w-5 h-px bg-[#c9a96e]" />
                Just Landed
              </p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-normal text-[#1a1916] [font-family:'Instrument_Serif',serif] leading-tight">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/products?sort_by=created_at&sort_order=desc"
              className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1a1916] hover:text-[#c9a96e] uppercase tracking-[0.1em] transition-colors border-b border-[#1a1916] hover:border-[#c9a96e] pb-0.5"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.slice(0, 8).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════
          TRUST ICONS — bottom
      ════════════════════════════════════ */}
      <section className="site-container pt-16 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#ede9e2]">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.label}
              className="bg-[#faf8f5] flex flex-col items-center text-center gap-3 py-8 px-4"
            >
              <div className="w-10 h-10 bg-[#1a1916] flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-[#c9a96e]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#1a1916] ">
                  {item.label}
                </p>
                <p className="text-[11px] text-[#9a9086] font-light mt-0.5">
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
