"use client";

import { Product } from "@/lib/types";
import { formatPrice, getDiscountPercent, getDisplayPrice, getEffectivePrice, getProductImage, hasVariants } from "@/lib/utils";
import { useAuthStore, useCartStore } from "@/store";
import { motion } from "framer-motion";
import { ShoppingBag, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

interface Props {
  product: Product;
  index?: number;
}

const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '');
};

export default function ProductCard({ product, index = 0 }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuthStore();

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

  const ep = getEffectivePrice(product.price, product.discount_price);
  const discount = getDiscountPercent(product.price, product.discount_price);
  const isInStock = product.stock_quantity > 0;

  const specs = product.attributes ? Object.entries(product.attributes).slice(0, 3) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="h-full"
    >
      <div className="group relative flex flex-col h-full bg-white border border-gray-100 hover:shadow-[0_2px_15px_rgb(0,0,0,0.05)] transition-all duration-300 overflow-hidden">

        {/* Badges */}
        {discount > 0 ? (
          <div className="absolute top-1.5 right-1.5 z-10 bg-[#b91c1c] text-white text-[8.5px] px-1.5 py-0.5 font-bold rounded-sm tracking-wider uppercase shadow-sm">
            -{discount}%
          </div>
        ) : product.is_featured ? (
          <div className="absolute top-1.5 right-1.5 z-10 bg-zinc-900 text-white text-[8.5px] px-1.5 py-0.5 font-bold rounded-sm tracking-wider uppercase shadow-sm">
            TOP
          </div>
        ) : null}

        {/* Image Container - Changed to contain */}
        <Link href={`/products/${product.slug}`} className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden block shrink-0">
          <Image
            src={getProductImage(product)}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {!isInStock && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="bg-zinc-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-sm">
                Sold Out
              </span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-2.5 flex flex-col flex-1">
          <p className="text-[8.5px] font-bold tracking-[0.05em] text-gray-400 uppercase mb-0.5">
            {product.category_name || "PRODUCT"}
          </p>

          <Link href={`/products/${product.slug}`}>
            <h3 className="text-gray-900 text-[13px] font-bold leading-snug mb-1 hover:text-[#b91c1c] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <p className="text-[10px] text-gray-400 line-clamp-1 leading-tight mb-2">
            {product.description ? stripHtml(product.description) : "Premium configuration engineered for peak performance."}
          </p>

          {/* Spec tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {specs.slice(0, 2).map(([key, value], idx) => (
              <span key={idx} className="bg-gray-100/80 text-gray-500 text-[8.5px] font-semibold px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                {String(value).substring(0, 12)}
              </span>
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex items-end justify-between mb-2">
              <div className="flex flex-col">
                {ep.original && !hasVariants(product) && (
                  <span className="text-[10px] text-[#9ca3af] line-through font-medium mb-0">
                    {formatPrice(ep.original)}
                  </span>
                )}
                <span className="text-[15px] font-extrabold text-gray-900 leading-none">
                  {hasVariants(product) ? getDisplayPrice(product) : formatPrice(ep.current)}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md font-bold text-[10px] transition-colors focus:ring-1 focus:ring-offset-1 focus:ring-gray-900
                  ${!isInStock ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#1f1f1f] text-white hover:bg-black"}
                `}
              >
                Buy
                <ShoppingBag size={11} strokeWidth={2.5} className="mb-[1px]" />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
              <div className="flex items-center gap-1">
                <Star size={9} className="fill-[#facc15] text-[#facc15]" />
                <span className="text-[9px] text-gray-500 font-medium">
                  {product.average_rating ? Number(product.average_rating).toFixed(1) : "0"} ({product.review_count || 0})
                </span>
              </div>

              {isInStock ? (
                <span className="text-[#10b981] text-[9px] font-bold uppercase tracking-wide">In Stock</span>
              ) : (
                <span className="text-red-500 text-[9px] font-bold uppercase tracking-wide">Out of Stock</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
