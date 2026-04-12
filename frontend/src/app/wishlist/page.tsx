"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { Wishlist } from "@/lib/types";
import { formatPrice, getProductImage, getEffectivePrice } from "@/lib/utils";
import { useCartStore } from "@/store";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    api.get("/wishlist").then(({ data }) => data.success && setWishlist(data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const removeItem = async (productId: string) => {
    try {
      await api.delete(`/wishlist/items/${productId}`);
      setWishlist((w) => w ? { ...w, items: w.items.filter((i) => i.product_id !== productId) } : null);
      toast.success("Removed from wishlist");
    } catch { toast.error("Failed"); }
  };

  const moveToCart = async (productId: string) => {
    try {
      await addItem(productId, 1);
      await removeItem(productId);
      toast.success("Moved to cart!");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><Heart className="w-8 h-8 text-[var(--accent)]" /> My Wishlist</h1>
      {loading ? <div className="skeleton h-48 rounded-xl" /> :
      !wishlist?.items?.length ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] mb-4">Your wishlist is empty</p>
          <Link href="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {wishlist.items.map((item) => (
            <div key={item.id} className="glass-card p-4 flex gap-4 items-center">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--bg-tertiary)] flex-shrink-0 relative">
                <Image src={getProductImage(item.product)} alt={item.product?.name || ""} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product?.slug}`} className="font-semibold hover:text-[var(--accent-light)]">{item.product?.name}</Link>
                <p className="text-[var(--accent-light)] font-bold mt-1">{formatPrice(getEffectivePrice(item.product?.price || "0", item.product?.discount_price || "0").current)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => moveToCart(item.product_id)} className="btn-primary py-2 px-3 text-xs"><ShoppingCart className="w-4 h-4" /></button>
                <button onClick={() => removeItem(item.product_id)} className="btn-danger py-2 px-3 text-xs"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
