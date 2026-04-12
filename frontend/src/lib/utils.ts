import { CartItem, Product, Variant } from "./types";

export function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return "৳0";
  return `${num.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}৳`;
}

export function getProductImage(product: { images?: { image_url: string; is_primary: boolean }[] }): string {
  if (!product.images || product.images.length === 0) {
    return "/placeholder-product.png";
  }
  const primary = product.images.find((img) => img.is_primary);
  return primary?.image_url || product.images[0].image_url;
}

export function getVariantImage(variant: Variant): string {
  if (!variant.images || variant.images.length === 0) return "";
  const primary = variant.images.find((img) => img.is_primary);
  return primary?.image_url || variant.images[0].image_url;
}

/** Cart line: prefer variant image when present, else product primary/first. */
export function getCartItemImage(item: Pick<CartItem, "product" | "variant">): string {
  if (item.variant) {
    const v = getVariantImage(item.variant);
    if (v) return v;
  }
  if (item.product) return getProductImage(item.product);
  return "/placeholder-product.png";
}

export function getCartLineMaxQty(item: Pick<CartItem, "product" | "variant" | "quantity">): number {
  if (item.variant?.stock_quantity != null && item.variant.stock_quantity >= 0) {
    return item.variant.stock_quantity;
  }
  if (item.product?.stock_quantity != null) return item.product.stock_quantity;
  return 999;
}

/**
 * Returns the effective price for display.
 * If discount_price > 0 and < price, discount_price is the sale price.
 * Otherwise, price is the current price.
 */
export function getEffectivePrice(price: string, discountPrice: string): { current: number; original: number | null } {
  const p = parseFloat(price) || 0;
  const dp = parseFloat(discountPrice) || 0;
  if (dp > 0 && dp < p) {
    return { current: dp, original: p };
  }
  return { current: p, original: null };
}

export function getVariantPrice(product: Product, variant?: Variant): { price: string; discountPrice: string } {
  if (variant) {
    return { price: variant.price, discountPrice: variant.discount_price };
  }
  return { price: product.price, discountPrice: product.discount_price };
}

export function getVariantStock(product: Product, variant?: Variant): number {
  if (variant) return variant.stock_quantity;
  return product.stock_quantity;
}

export function hasVariants(product: Product): boolean {
  return !!(product.variants && product.variants.length > 0);
}

export function getPriceRange(product: Product): { min: number; max: number } | null {
  if (!product.variants || product.variants.length === 0) return null;
  const prices = product.variants.map((v) => {
    const ep = getEffectivePrice(v.price, v.discount_price);
    return ep.current;
  });
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getDisplayPrice(product: Product): string {
  const range = getPriceRange(product);
  if (range && range.min !== range.max) {
    return `${formatPrice(range.min)} - ${formatPrice(range.max)}`;
  }
  if (range) return formatPrice(range.min);
  const ep = getEffectivePrice(product.price, product.discount_price);
  return formatPrice(ep.current);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-600",
    confirmed: "bg-blue-500/20 text-blue-600",
    processing: "bg-purple-500/20 text-purple-600",
    shipped: "bg-cyan-500/20 text-cyan-600",
    delivered: "bg-green-500/20 text-green-600",
    cancelled: "bg-red-500/20 text-red-600",
    completed: "bg-green-500/20 text-green-600",
    failed: "bg-red-500/20 text-red-600",
    refunded: "bg-orange-500/20 text-orange-600",
  };
  return colors[status] || "bg-gray-500/20 text-gray-500";
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getDiscountPercent(price: string, discountPrice: string): number {
  const p = parseFloat(price) || 0;
  const dp = parseFloat(discountPrice) || 0;
  if (!dp || dp <= 0 || dp >= p) return 0;
  return Math.round((1 - dp / p) * 100);
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = "sess_" + crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
}
