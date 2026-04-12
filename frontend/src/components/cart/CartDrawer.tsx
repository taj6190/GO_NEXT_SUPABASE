"use client";

import { formatPrice, getCartItemImage, getCartLineMaxQty, getEffectivePrice } from "@/lib/utils";
import { useCartStore, useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function CartDrawer() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getSubtotal, isLoading, fetchCart } = useCartStore();
  const { cartOpen, setCartOpen } = useUIStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  const subtotal = getSubtotal();
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  useEffect(() => {
    if (cartOpen) {
      void fetchCart();
    }
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
    const discountPrice = item.variant?.discount_price || item.product?.discount_price || "0";
    return getEffectivePrice(price, discountPrice);
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
            onClick={() => setCartOpen(false)}
            aria-hidden
          />

          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal
            aria-labelledby="cart-drawer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[min(100vw,22rem)] flex-col border-l border-[var(--border)] bg-[var(--bg-secondary)] shadow-xl"
          >
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 id="cart-drawer-title" className="text-sm font-bold leading-tight">
                    Cart
                  </h2>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {itemCount} {itemCount === 1 ? "piece" : "pieces"} · {items.length} {items.length === 1 ? "line" : "lines"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                aria-label="Close cart"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {isLoading && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-[var(--text-muted)]">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                  <p className="text-xs">Loading…</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)]">
                    <ShoppingBag className="h-7 w-7 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Your cart is empty</p>
                  <p className="mt-1 max-w-[14rem] text-xs text-[var(--text-muted)]">Browse products and tap Add to cart.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      router.push("/products");
                    }}
                    className="btn-primary mt-4 !py-2 !px-4 text-xs"
                  >
                    Browse products
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
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
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.18 }}
                          className="list-none"
                        >
                          <div className="flex gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)]/60 p-2 hover:border-[var(--border)]">
                            <Link
                              href={item.product?.slug ? `/products/${item.product.slug}` : "/products"}
                              onClick={() => setCartOpen(false)}
                              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-secondary)]"
                            >
                              <Image src={img} alt={item.product?.name ?? "Product"} fill className="object-cover" sizes="56px" />
                            </Link>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-1">
                                <Link
                                  href={item.product?.slug ? `/products/${item.product.slug}` : "/products"}
                                  onClick={() => setCartOpen(false)}
                                  className="line-clamp-2 text-xs font-medium leading-snug text-[var(--text-primary)] hover:text-[var(--accent)]"
                                >
                                  {item.product?.name}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                                  aria-label="Remove"
                                  disabled={isLoading}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {item.variant?.options && item.variant.options.length > 0 && (
                                <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{item.variant.options.map((o) => o.value_name).join(" · ")}</p>
                              )}

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <div className="flex h-7 items-center overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-xs">
                                  <button
                                    type="button"
                                    onClick={() => (item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id))}
                                    className="flex h-full w-7 items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40"
                                    disabled={isLoading}
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="flex min-w-[1.5rem] items-center justify-center border-x border-[var(--border)] px-1 font-medium tabular-nums">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="flex h-full w-7 items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40"
                                    disabled={isLoading || atMax}
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="text-right">
                                  {ep.original != null && (
                                    <p className="text-[10px] text-[var(--text-muted)] line-through">{formatPrice(ep.original * item.quantity)}</p>
                                  )}
                                  <p className="text-xs font-semibold text-[var(--accent)]">{formatPrice(line)}</p>
                                </div>
                              </div>
                              {atMax && maxQty < 999 && <p className="mt-0.5 text-[9px] text-amber-600/90">Max {maxQty} in stock</p>}
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="shrink-0 space-y-2 border-t border-[var(--border)] bg-[var(--bg-tertiary)]/40 px-3 py-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Subtotal</span>
                  <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">Delivery</span>
                  <span className="text-[var(--text-muted)]">At checkout</span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 text-sm font-bold">
                  <span>Total</span>
                  <span className="tabular-nums text-[var(--accent)]">{formatPrice(subtotal)}</span>
                </div>
                <button type="button" onClick={handleCheckout} className="btn-primary flex h-10 w-full items-center justify-center gap-1.5 text-sm">
                  Checkout <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setCartOpen(false)} className="btn-secondary flex h-9 w-full items-center justify-center text-xs">
                  Keep shopping
                </button>
              </footer>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
