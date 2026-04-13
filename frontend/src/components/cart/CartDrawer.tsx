/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  formatPrice,
  getCartItemImage,
  getCartLineMaxQty,
  getEffectivePrice,
} from "@/lib/utils";
import { useCartStore, useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    isLoading,
    fetchCart,
  } = useCartStore();
  const { cartOpen, setCartOpen } = useUIStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  const subtotal = getSubtotal();
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const freeShippingThreshold = 2000;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = Math.min(
    100,
    (subtotal / freeShippingThreshold) * 100,
  );

  useEffect(() => {
    if (cartOpen) void fetchCart();
  }, [cartOpen, fetchCart]);

  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && cartOpen) setCartOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [cartOpen, setCartOpen]);

  const handleCheckout = () => {
    setCartOpen(false);
    router.push("/checkout");
  };

  const getItemPrice = (item: (typeof items)[0]) => {
    const price = item.variant?.price || item.product?.price || "0";
    const discountPrice =
      item.variant?.discount_price || item.product?.discount_price || "0";
    return getEffectivePrice(price, discountPrice);
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 bg-[#1a1916]/60 backdrop-blur-[2px]"
            onClick={() => setCartOpen(false)}
            aria-hidden
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal
            aria-labelledby="cart-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-101 flex w-full max-w-88 flex-col bg-[#faf8f5] border-l border-[#ede9e2] shadow-2xl font-['DM_Sans',sans-serif]"
          >
            {/* ── HEADER ── */}
            <header className="flex shrink-0 items-center justify-between gap-2 bg-[#1a1916] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#c9a96e] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 text-[#1a1916]" />
                </div>
                <div>
                  <h2
                    id="cart-title"
                    className="text-[14px] font-normal text-[#f5f0e8] font-['Instrument_Serif',serif] leading-none"
                  >
                    Your Cart
                  </h2>
                  <p className="text-[10px] text-[#6b6560] mt-0.5">
                    {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                    {items.length} {items.length === 1 ? "line" : "lines"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="p-1.5 text-[#6b6560] hover:text-[#f5f0e8] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* ── FREE SHIPPING PROGRESS ── */}
            {items.length > 0 && (
              <div className="bg-white border-b border-[#ede9e2] px-5 py-3 shrink-0">
                {remaining > 0 ? (
                  <p className="text-[11px] text-[#9a9086] mb-1.5 font-light">
                    Add{" "}
                    <span className="text-[#1a1916] font-semibold">
                      ৳{remaining.toLocaleString("en-IN")}
                    </span>{" "}
                    more for free delivery
                  </p>
                ) : (
                  <p className="text-[11px] text-[#4ade80] font-semibold mb-1.5">
                    🎉 You've unlocked free delivery!
                  </p>
                )}
                <div className="h-1 bg-[#f0ebe3] overflow-hidden">
                  <motion.div
                    className="h-full bg-[#c9a96e]"
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgress}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            {/* ── ITEMS ── */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {isLoading && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                  <div className="w-6 h-6 border-2 border-[#e8e2d9] border-t-[#c9a96e] rounded-full animate-spin" />
                  <p className="text-[12px] text-[#9a9086]">Loading…</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="w-16 h-16 bg-[#f0ebe3] flex items-center justify-center mb-4">
                    <ShoppingBag className="w-7 h-7 text-[#c4bcb2]" />
                  </div>
                  <p className="text-[16px] font-normal text-[#1a1916] font-['Instrument_Serif',serif] mb-1">
                    Your cart is empty
                  </p>
                  <p className="text-[12px] text-[#9a9086] font-light mb-6 max-w-45 leading-relaxed">
                    Browse our collection and add items to get started.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      router.push("/products");
                    }}
                    className="inline-flex items-center gap-2 bg-[#1a1916] hover:bg-[#c9a96e] text-[#f5f0e8] hover:text-[#1a1916] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest transition-all duration-200"
                  >
                    Browse Products
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  <AnimatePresence initial={false} mode="popLayout">
                    {items.map((item) => {
                      const ep = getItemPrice(item);
                      const line = ep.current * item.quantity;
                      const img = getCartItemImage(item);
                      const maxQty = getCartLineMaxQty(item);
                      const atMax = item.quantity >= maxQty;

                      return (
                        <motion.li
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2 }}
                          className="list-none"
                        >
                          <div className="flex gap-3 bg-white border border-[#ede9e2] hover:border-[#c9a96e]/30 p-3 transition-colors duration-200">
                            {/* Product image */}
                            <Link
                              href={
                                item.product?.slug
                                  ? `/products/${item.product.slug}`
                                  : "/products"
                              }
                              onClick={() => setCartOpen(false)}
                              className="relative w-16 h-16 shrink-0 bg-[#faf8f5] border border-[#ede9e2]"
                            >
                              <Image
                                src={img}
                                alt={item.product?.name ?? "Product"}
                                fill
                                className="object-contain p-1"
                                sizes="64px"
                              />
                            </Link>

                            <div className="min-w-0 flex-1">
                              {/* Name + remove */}
                              <div className="flex items-start justify-between gap-1 mb-0.5">
                                <Link
                                  href={
                                    item.product?.slug
                                      ? `/products/${item.product.slug}`
                                      : "/products"
                                  }
                                  onClick={() => setCartOpen(false)}
                                  className="text-[12px] font-medium text-[#1a1916] hover:text-[#c9a96e] transition-colors line-clamp-2 leading-snug"
                                >
                                  {item.product?.name}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  disabled={isLoading}
                                  aria-label="Remove"
                                  className="shrink-0 p-1 text-[#c4bcb2] hover:text-[#b87878] transition-colors ml-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Variant */}
                              {item.variant?.options &&
                                item.variant.options.length > 0 && (
                                  <p className="text-[10px] text-[#9a9086] mb-1.5">
                                    {item.variant.options
                                      .map((o) => o.value_name)
                                      .join(" · ")}
                                  </p>
                                )}

                              {/* Qty + price */}
                              <div className="flex items-center justify-between mt-2">
                                {/* Qty stepper */}
                                <div className="flex items-center h-7 border border-[#ede9e2] bg-[#faf8f5]">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      item.quantity > 1
                                        ? updateQuantity(
                                            item.id,
                                            item.quantity - 1,
                                          )
                                        : removeItem(item.id)
                                    }
                                    disabled={isLoading}
                                    aria-label="Decrease"
                                    className="w-7 h-full flex items-center justify-center text-[#9a9086] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors disabled:opacity-40"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-7 h-full flex items-center justify-center text-[12px] font-semibold text-[#1a1916] border-x border-[#ede9e2] tabular-nums">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity + 1)
                                    }
                                    disabled={isLoading || atMax}
                                    aria-label="Increase"
                                    className="w-7 h-full flex items-center justify-center text-[#9a9086] hover:text-[#1a1916] hover:bg-[#f0ebe3] transition-colors disabled:opacity-40"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  {ep.original != null && (
                                    <p className="text-[10px] text-[#c4bcb2] line-through tabular-nums">
                                      {formatPrice(ep.original * item.quantity)}
                                    </p>
                                  )}
                                  <p className="text-[13px] font-semibold text-[#1a1916] tabular-nums">
                                    {formatPrice(line)}
                                  </p>
                                </div>
                              </div>

                              {atMax && maxQty < 999 && (
                                <p className="text-[9.5px] text-[#c9a96e] mt-1">
                                  Max {maxQty} in stock
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* ── FOOTER ── */}
            {items.length > 0 && (
              <footer className="shrink-0 bg-white border-t border-[#ede9e2] px-5 pt-4 pb-5">
                {/* Totals */}
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#9a9086] font-light">Subtotal</span>
                    <span className="font-medium text-[#1a1916] tabular-nums">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#9a9086] font-light">Delivery</span>
                    <span className="text-[#9a9086] font-light">
                      {subtotal >= freeShippingThreshold ? (
                        <span className="text-[#4ade80] font-medium">Free</span>
                      ) : (
                        "At checkout"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#ede9e2] text-[14px]">
                    <span className="font-medium text-[#1a1916]">Total</span>
                    <span className="font-semibold text-[#1a1916] tabular-nums font-['Instrument_Serif',serif] text-[18px]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="relative w-full h-12 bg-[#1a1916] hover:bg-[#c9a96e] text-[#f5f0e8] hover:text-[#1a1916] flex items-center justify-center gap-2.5 text-[12px] font-semibold uppercase tracking-widest transition-all duration-200 overflow-hidden group mb-2.5"
                >
                  <span className="absolute inset-0 bg-linear-to-br from-transparent to-[#c9a96e]/10 group-hover:opacity-0 pointer-events-none transition-opacity" />
                  Proceed to Checkout
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="w-full h-10 bg-transparent border border-[#ede9e2] text-[#6b6258] hover:border-[#c9a96e] hover:text-[#1a1916] flex items-center justify-center text-[11px] font-medium uppercase tracking-widest transition-all duration-200"
                >
                  Continue Shopping
                </button>
              </footer>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
