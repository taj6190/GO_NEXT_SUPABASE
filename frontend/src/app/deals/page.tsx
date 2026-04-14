"use client";

import ProductCard from "@/components/product/ProductCard";
import api from "@/lib/api";
import { Product } from "@/lib/types";
import { motion } from "framer-motion";
import { Clock, Flame, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

function FlashSaleHero() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateTimer = () => {
      // Flash sale ends at 8 PM daily
      const now = new Date();
      let endTime = new Date();
      endTime.setHours(20, 0, 0, 0);

      if (now > endTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const diff = endTime.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1916] via-[#2d2824] to-[#1a1916] border-b border-[#c9a96e] py-8 sm:py-12">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a96e] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#c9a96e] rounded-full blur-3xl"></div>
      </div>

      <div className="site-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-8 h-8 text-[#ff6b35] fill-[#ff6b35]" />
              </motion.div>
              <span className="text-[#ff6b35] text-xs font-bold tracking-[0.2em] uppercase">
                সীমিত সময়ের অফার
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
              ফ্ল্যাশ সেল
            </h1>
            <p className="text-[#c9a96e] text-lg sm:text-xl font-medium mb-3">
              ১০% এর বেশি ছাড়ে পণ্য পান
            </p>
            <p className="text-[#a09a8e] text-sm sm:text-base mb-6">
              প্রতিদিন বিশাল ছাড়ে নির্বাচিত পণ্য কিনুন। এখনই অর্ডার করুন এবং
              সর্বোচ্চ সঞ্চয় করুন।
            </p>

            <div className="flex items-center gap-2 text-[#9a9086]">
              <TrendingUp className="w-5 h-5 text-[#c9a96e]" />
              <span className="text-sm">১০০+ পণ্যে এখন ডিসকাউন্ট চলছে</span>
            </div>
          </motion.div>

          {/* Right: Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-[#2d2824] border-2 border-[#c9a96e] p-6 sm:p-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-[#ff6b35]" />
              <span className="text-[#c9a96e] font-semibold text-sm">
                আজকের অফার শেষ হতে বাকি
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              {[
                { value: timeLeft.hours, label: "ঘণ্টা" },
                { value: timeLeft.minutes, label: "মিনিট" },
                { value: timeLeft.seconds, label: "সেকেন্ড" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: idx * 0.1,
                  }}
                  className="bg-[#1a1916] border border-[#c9a96e] py-4 text-center"
                >
                  <div className="text-2xl sm:text-4xl font-bold text-[#c9a96e]">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#9a9086] mt-2 uppercase tracking-widest">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#1a1916] border border-[#ff6b35]/30">
              <p className="text-[#ff6b35] text-xs font-semibold text-center">
                ⚡ দ্রুত অর্ডার করুন - স্টক সীমিত!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function FlashSalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgDiscount: 0,
    limitedStock: 0,
  });

  useEffect(() => {
    const fetchFlashSaleProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/products?limit=500");
        if (data.success && Array.isArray(data.data)) {
          // Filter products with discount > 10%
          const filtered = data.data.filter((product: Product) => {
            const price = Number(product.price);
            const discountPrice = Number(product.discount_price);
            if (price > 0 && discountPrice > 0 && discountPrice < price) {
              const discount = ((price - discountPrice) / price) * 100;
              return discount > 10;
            }
            return false;
          });

          // Calculate statistics
          const avgDiscount =
            filtered.length > 0
              ? filtered.reduce((sum: number, p: Product) => {
                  const price = Number(p.price);
                  const discountPrice = Number(p.discount_price);
                  return sum + ((price - discountPrice) / price) * 100;
                }, 0) / filtered.length
              : 0;

          const limitedStock = filtered.filter(
            (p: Product) => p.stock_quantity > 0 && p.stock_quantity <= 10,
          ).length;

          setProducts(filtered.sort(() => Math.random() - 0.5)); // Shuffle for variety
          setStats({
            total: filtered.length,
            avgDiscount: Math.round(avgDiscount),
            limitedStock,
          });
        }
      } catch (error) {
        console.error("Failed to fetch flash sale products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSaleProducts();
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <FlashSaleHero />

      {/* Stats Bar */}
      <div className="bg-[#faf8f5] border-b border-[#ede9e2] py-4 sm:py-5">
        <div className="site-container">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6b6258]">
                মোট ডিল পণ্য
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#1a1916] mt-1">
                {stats.total}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6b6258]">
                গড় ছাড়
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#c9a96e] mt-1">
                {stats.avgDiscount}%
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6b6258]">
                সীমিত স্টক
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#ff6b35] mt-1">
                {stats.limitedStock}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="site-container py-12 sm:py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#f5f1eb] rounded-sm h-80 animate-pulse"
              ></div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1916] mb-8">
              বিশেষ ছাড়ে সব পণ্য
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {products.map((product) => {
                const price = Number(product.price);
                const discountPrice = Number(product.discount_price);
                const discountPercent =
                  price > 0
                    ? Math.round(((price - discountPrice) / price) * 100)
                    : 0;

                return (
                  <div key={product.id} className="relative">
                    {/* Discount badge */}
                    {discountPercent > 0 && (
                      <div className="absolute top-2 right-2 z-10 bg-[#ff6b35] text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-current" />-
                        {discountPercent}%
                      </div>
                    )}

                    {/* Limited stock indicator */}
                    {product.stock_quantity > 0 &&
                      product.stock_quantity <= 10 && (
                        <div className="absolute bottom-2 left-2 z-10 bg-[#1a1916] text-[#ff6b35] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em]">
                          শীঘ্রই শেষ হবে
                        </div>
                      )}

                    <ProductCard product={product} />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Flame className="w-12 h-12 text-[#c9a96e] mx-auto mb-4 opacity-50" />
            <p className="text-[#9a9086] text-lg">
              এই মুহূর্তে কোনো ফ্ল্যাশ সেল পণ্য পাওয়া যাচ্ছে না।
            </p>
            <p className="text-[#6b6258] text-sm mt-2">শীঘ্রই আপডেট থাকুন!</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      {products.length > 0 && (
        <div className="bg-[#1a1916] border-t-4 border-[#c9a96e] py-8 sm:py-12">
          <div className="site-container text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              এই অফার মিস করবেন না!
            </h3>
            <p className="text-[#a09a8e] mb-6 max-w-2xl mx-auto">
              প্রতিদিন নতুন পণ্যে ছাড় পান। আমাদের নিউজলেটার সাবস্ক্রাইব করুন
              এবং সেরা ডিলগুলি সবার আগে জানুন।
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
