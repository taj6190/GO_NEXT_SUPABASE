"use client";

import ProductCard from "@/components/product/ProductCard";
import api from "@/lib/api";
import { Category, Product } from "@/lib/types";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  useEffect(() => {
    api.get("/products/featured").then(({ data }) => data.success && setFeatured(data.data || [])).catch(() => {});
    api.get("/categories").then(({ data }) => data.success && setCategories(data.data || [])).catch(() => {});
    api.get("/products?sort_by=created_at&sort_order=desc&limit=8").then(({ data }) => data.success && setNewArrivals(data.data || [])).catch(() => {});
  }, []);

  return (
    <div className="page-enter pb-16 mt-2">
      <div className="site-container my-6 space-y-6">
        {/* --- HERO SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Slider (Left) */}
          <div className="lg:col-span-3 h-[300px] md:h-[520px] relative overflow-hidden shadow-xl group cursor-pointer" onClick={() => router.push('/products')}>
            <img
              src="https://wallpaperaccess.com/full/431759.jpg"
              alt="Laptop & Desktop"
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="absolute bottom-10 left-6 md:left-16 max-w-lg text-white z-10">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                Upgrade Your <br />
                <span className="text-blue-500">Workspace</span>
              </h1>
              <p className="text-gray-300 mb-6 text-sm md:text-base">
                High-performance laptops, desktops, and professional monitors for your productivity and gaming setup.
              </p>
              <Link
                href="/products"
                className="bg-blue-600 px-6 py-2.5 font-bold text-sm hover:bg-blue-700 transition-colors inline-block"
              >
                Shop Electronics
              </Link>
            </div>
          </div>

          {/* Side Banners (Right) */}
          <div className="hidden lg:flex flex-col gap-6 h-[520px]">
            <div className="flex-1 overflow-hidden relative shadow-lg group cursor-pointer" onClick={() => router.push('/products')}>
              <img
                src="https://png.pngtree.com/thumb_back/fh260/background/20230705/pngtree-d-illustration-of-abstract-blue-background-with-modern-headphones-ideal-for-image_3807815.jpg"
                alt="Premium Headphones"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 z-10 text-white w-full">
                <h4 className="font-bold text-xl mb-1">Premium Headphones</h4>
                <p className="text-xs text-gray-200 mb-3">Wireless & Noise Cancelling</p>
                <Link
                  href="/products"
                  className="text-xs font-bold text-blue-500 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  Shop Now <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative shadow-lg group cursor-pointer" onClick={() => router.push('/products')}>
              <img
                src="https://cdn.prod.www.spiegel.de/images/959b2ad9-1b1a-47f9-ae0e-ade09327dce2_w960_r1.778_fpx61.49_fpy50.jpg"
                alt="Smartphones & Accessories"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 z-10 text-white w-full">
                <h4 className="font-bold text-xl mb-1">Smartphones & Accessories</h4>
                <p className="text-xs text-gray-200 mb-3">Latest models & Gadgets</p>
                <Link
                  href="/products"
                  className="text-xs font-bold text-blue-500 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  Shop Now <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- SCROLLING MARQUEE SECTION --- */}
        <div className="relative w-full max-w-full bg-white py-2.5 md:py-3 border border-gray-100 overflow-hidden flex shadow-sm mt-4 md:mt-6 mb-10 md:mb-12">
          <div className="absolute left-0 top-0 bottom-0 w-6 md:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 md:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="flex shrink-0 min-w-full justify-around items-center animate-marquee">
            <span className="whitespace-nowrap text-[11px] md:text-sm font-medium text-gray-600 tracking-wide flex items-center">🚀 Fast & Free Delivery over ৳2,000</span>
            <span className="text-gray-300 mx-3 md:mx-8 text-[10px] md:text-xs">✦</span>
            <span className="whitespace-nowrap text-[11px] md:text-sm font-medium text-gray-600 tracking-wide flex items-center">🛡️ 30-Day Money-Back Guarantee</span>
            <span className="text-gray-300 mx-3 md:mx-8 text-[10px] md:text-xs">✦</span>
            <span className="whitespace-nowrap text-[11px] md:text-sm font-medium text-gray-600 tracking-wide flex items-center">⚡ 24/7 Premium Support</span>
            <span className="text-gray-300 mx-3 md:mx-8 text-[10px] md:text-xs">✦</span>
            <span className="whitespace-nowrap text-[11px] md:text-sm font-medium text-gray-600 tracking-wide flex items-center">🔥 Up to 50% Off Flash Deals</span>
            <span className="text-gray-300 mx-3 md:mx-8 text-[10px] md:text-xs">✦</span>
          </div>
          <div aria-hidden="true" className="flex shrink-0 min-w-full justify-around items-center animate-marquee">
            <span className="whitespace-nowrap text-[11px] md:text-sm font-medium text-gray-600 tracking-wide flex items-center">🚀 Fast & Free Delivery over ৳2,000</span>
            <span className="text-gray-300 mx-3 md:mx-8 text-[10px] md:text-xs">✦</span>
            <span className="whitespace-nowrap text-[11px] md:text-sm font-medium text-gray-600 tracking-wide flex items-center">🛡️ 30-Day Money-Back Guarantee</span>
            <span className="text-gray-300 mx-3 md:mx-8 text-[10px] md:text-xs">✦</span>
            <span className="whitespace-nowrap text-[11px] md:text-sm font-medium text-gray-600 tracking-wide flex items-center">⚡ 24/7 Premium Support</span>
            <span className="text-gray-300 mx-3 md:mx-8 text-[10px] md:text-xs">✦</span>
            <span className="whitespace-nowrap text-[11px] md:text-sm font-medium text-gray-600 tracking-wide flex items-center">🔥 Up to 50% Off Flash Deals</span>
            <span className="text-gray-300 mx-3 md:mx-8 text-[10px] md:text-xs">✦</span>
          </div>
        </div>
      </div>

      {/* Categories Grid - Full Image Overlay */}
      {categories.length > 0 && (
        <section className="site-container my-12 md:my-16">
          <div className="flex flex-col items-center justify-center text-center mb-8 md:mb-10">
            <h2 className="text-[20px] md:text-[24px] font-bold text-gray-900 mb-2">Shop by Category</h2>
            <p className="text-[13px] md:text-[15px] text-gray-600">Discover premium collections picked just for you!</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 md:gap-5">
            {categories.slice(0, 16).map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, ease: "easeOut" }} className="h-full">
                <Link href={`/products?category_id=${cat.id}`} className="block group w-full relative overflow-hidden aspect-square shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 bg-gray-100">

                  {cat.image_url ? (
                    <Image src={cat.image_url} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw" />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-1000">
                      📁
                    </div>
                  )}

                  {/* Standard Gradient Mask */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Normal Text Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h3 className="font-bold text-[13px] sm:text-[15px] text-white leading-tight drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300">
                      {cat.name}
                    </h3>
                  </div>

                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="site-container mb-24">
          <div className="flex items-end justify-between mb-10">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="text-3xl md:text-xl font-bold tracking-tight mt-10">Featured Products</h2>
              </div>
            </div>
            <Link href="/products?featured=true" className="hidden sm:flex text-[var(--brand)] hover:text-[var(--brand-light)] font-semibold items-center gap-1 transition-colors">
              Explore All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="bg-[var(--bg-secondary)] border-y border-[var(--border)] py-10">
          <div className="site-container">
            <div className="flex items-end justify-between pb-10">
              <div className="flex items-start gap-4">
                <div>
                  <h2 className="text-3xl md:text-xl font-bold tracking-tight">New Arrivals</h2>
                </div>
              </div>
              <Link href="/products?sort_by=created_at&sort_order=desc" className="hidden sm:flex text-[var(--brand)] hover:text-[var(--brand-light)] font-semibold items-center gap-1 transition-colors">
                View Latest <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
