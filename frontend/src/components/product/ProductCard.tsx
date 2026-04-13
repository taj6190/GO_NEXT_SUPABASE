/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Product } from "@/lib/types";
import {
  formatPrice,
  getDiscountPercent,
  getDisplayPrice,
  getEffectivePrice,
  getProductImage,
  hasVariants,
} from "@/lib/utils";
import { useAuthStore, useCartStore, useUIStore } from "@/store";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

interface Props {
  product: Product;
  index?: number;
}

const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "");
};

export default function ProductCard({ product, index = 0 }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuthStore();
  const { setBuyNowProduct } = useUIStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(product.id, 1);
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add");
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBuyNowProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      discount_price: product.discount_price,
      image_url: getProductImage(product),
      quantity: 1,
    });
  };

  const ep = getEffectivePrice(product.price, product.discount_price);
  const discount = getDiscountPercent(product.price, product.discount_price);
  const isInStock = product.stock_quantity > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1] as const, // Added 'as const' to fix strict TS build errors
      }}
      className="h-full"
    >
      <div className="group relative flex flex-col h-full bg-white border border-[#ede9e2] hover:border-[#c9a96e]/40 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden">
        {/* ── Badges ── */}
        {discount > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-[#1a1916] text-[#c9a96e] text-[9px] px-2 py-1 font-semibold tracking-[0.12em] uppercase font-['DM_Sans',sans-serif]">
            -{discount}%
          </div>
        )}
        {!discount && product.is_featured && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-[#c9a96e] text-[#1a1916] text-[9px] px-2 py-1 font-semibold tracking-[0.12em] uppercase font-['DM_Sans',sans-serif]">
            TOP
          </div>
        )}

        {/* ── Image Wrapper ── */}
        <div className="relative w-full aspect-4/3 bg-[#faf8f5] overflow-hidden shrink-0">
          <Link
            href={`/products/${product.slug}`}
            className="block w-full h-full"
          >
            <Image
              src={getProductImage(product)}
              alt={product.name}
              fill
              className="object-contain p-3 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Hover action overlay */}
            <div className="absolute inset-0 bg-[#1a1916]/0 group-hover:bg-[#1a1916]/3 transition-colors duration-500" />
          </Link>

          {!isInStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
              <span className="bg-[#1a1916] text-[#faf8f5] text-[9px] font-semibold px-3 py-1 uppercase tracking-[0.14em] font-['DM_Sans',sans-serif]">
                Sold Out
              </span>
            </div>
          )}

          {/* ── Desktop Hover Actions ── (Hidden on mobile) */}
          {isInStock && (
            <div className="hidden md:flex absolute bottom-0 inset-x-0 gap-px translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20 pointer-events-auto">
              <button
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#c9a96e] hover:bg-[#b8944f] text-[#1a1916] text-[10px] font-semibold tracking-[0.08em] uppercase py-3 transition-colors duration-150 font-['DM_Sans',sans-serif]"
              >
                <Zap size={11} strokeWidth={2.5} /> Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a1916] hover:bg-[#2d2b28] text-[#faf8f5] text-[10px] font-semibold tracking-[0.08em] uppercase py-3 transition-colors duration-150 font-['DM_Sans',sans-serif]"
              >
                <ShoppingBag size={11} strokeWidth={2.5} /> Add Cart
              </button>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-3 flex flex-col flex-1 border-t border-[#ede9e2]">
          {/* Category */}
          <p className="text-[9.5px] font-semibold tracking-[0.14em] text-[#c9a96e] uppercase mb-1 font-['DM_Sans',sans-serif]">
            {product.category_name || "Product"}
          </p>

          {/* Name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-[#1a1916] text-[13px] font-medium leading-snug mb-1.5 hover:text-[#c9a96e] transition-colors duration-200 line-clamp-2 font-['DM_Sans',sans-serif]">
              {product.name}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-[10.5px] text-[#9a9086] leading-relaxed line-clamp-1 mb-2.5 font-['DM_Sans',sans-serif]">
            {product.description
              ? stripHtml(product.description)
              : "Premium quality, built to last."}
          </p>

          {/* Spacer to push pricing to bottom */}
          <div className="mt-auto flex flex-col gap-2">
            {/* Price & Rating Row */}
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-0.5">
                {ep.original && !hasVariants(product) && (
                  <span className="text-[10px] text-[#b0a898] line-through font-['DM_Sans',sans-serif]">
                    {formatPrice(ep.original)}
                  </span>
                )}
                <span className="text-[16px] font-semibold text-[#1a1916] leading-none font-['DM_Sans',sans-serif]">
                  {hasVariants(product)
                    ? getDisplayPrice(product)
                    : formatPrice(ep.current)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Star size={9} className="fill-[#c9a96e] text-[#c9a96e]" />
                <span className="text-[10px] text-[#9a9086] font-medium font-['DM_Sans',sans-serif]">
                  {product.average_rating
                    ? Number(product.average_rating).toFixed(1)
                    : "—"}{" "}
                  <span className="text-[#c4bcb2]">
                    ({product.review_count || 0})
                  </span>
                </span>
              </div>
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-[#f0ebe3]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isInStock ? "bg-[#4ade80]" : "bg-[#f87171]"}`}
              />
              <span
                className={`text-[9.5px] font-semibold uppercase tracking-widest font-['DM_Sans',sans-serif] ${isInStock ? "text-[#4ade80]" : "text-[#f87171]"}`}
              >
                {isInStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            {/* ── Mobile Static Actions ── (Hidden on Desktop) */}
            {isInStock && (
              <div className="flex md:hidden gap-1.5 pt-1">
                <button
                  onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#c9a96e] active:bg-[#b8944f] text-[#1a1916] text-[10px] font-semibold tracking-[0.08em] uppercase py-3 transition-colors duration-150 font-['DM_Sans',sans-serif]"
                >
                  <Zap size={11} strokeWidth={2.5} /> Buy
                </button>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a1916] active:bg-[#2d2b28] text-[#faf8f5] text-[10px] font-semibold tracking-[0.08em] uppercase py-3 transition-colors duration-150 font-['DM_Sans',sans-serif]"
                >
                  <ShoppingBag size={11} strokeWidth={2.5} /> Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
