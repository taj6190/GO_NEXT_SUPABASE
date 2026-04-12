"use client";

import ImageGallery from "@/components/product/ImageGallery";
import ProductCard from "@/components/product/ProductCard";
import ReviewSection from "@/components/product/ReviewSection";
import VariantSelector from "@/components/product/VariantSelector";
import api from "@/lib/api";
import { Product, Variant } from "@/lib/types";
import { formatPrice, getDiscountPercent, getEffectivePrice, hasVariants } from "@/lib/utils";
import { useAuthStore, useCartStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Minus, Plus, RotateCcw, Share2, Shield, ShoppingCart, Star, Truck, X, Zap } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (slug) {
      setLoading(true);
      api.get(`/products/${slug}`).then(({ data }) => {
        if (data.success) {
          setProduct(data.data);
          if (data.data.variants?.length > 0) {
            const firstVariant = data.data.variants[0];
            setSelectedVariant(firstVariant);
            const opts: Record<string, string> = {};
            firstVariant.options?.forEach((o: { option_group_id: string; option_value_id: string }) => {
              opts[o.option_group_id] = o.option_value_id;
            });
            setSelectedOptions(opts);
          }
        }
      }).catch(() => {}).finally(() => setLoading(false));

      api.get(`/products/${slug}/related`).then(({ data }) => {
        if (data.success) setRelated(data.data || []);
      }).catch(() => {});
    }
  }, [slug]);

  const handleOptionChange = useCallback((groupId: string, valueId: string) => {
    const newOptions = { ...selectedOptions, [groupId]: valueId };
    setSelectedOptions(newOptions);

    if (product?.variants) {
      const match = product.variants.find((v) => {
        if (!v.options) return false;
        return Object.entries(newOptions).every(([gId, vId]) =>
          v.options.some((o) => o.option_group_id === gId && o.option_value_id === vId)
        );
      });
      setSelectedVariant(match || null);

      if (match?.images?.length) {
        setGalleryIdx(0);
      }
    }
  }, [selectedOptions, product]);

  const galleryImages = useMemo(() => {
    if (selectedVariant?.images?.length) {
      return selectedVariant.images.map((img) => ({ id: img.id, image_url: img.image_url, is_primary: img.is_primary }));
    }
    return product?.images || [];
  }, [selectedVariant, product]);

  const isVariable = product ? hasVariants(product) : false;
  const currentPrice = selectedVariant ? selectedVariant.price : product?.price || "0";
  const currentDiscountPrice = selectedVariant ? selectedVariant.discount_price : product?.discount_price || "0";
  const currentStock = product ? (selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity) : 0;
  const ep = getEffectivePrice(currentPrice, currentDiscountPrice);
  const discount = getDiscountPercent(currentPrice, currentDiscountPrice);

  if (loading) {
    return (
      <div className="site-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/4" />
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-[var(--text-secondary)]">Product not found</p>
        <Link href="/products" className="btn-primary mt-4 inline-flex">Browse Products</Link>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (isVariable && !selectedVariant) {
      toast.error("Please select all options");
      return;
    }
    if (currentStock < quantity) {
      toast.error("Not enough stock");
      return;
    }

    try {
      await addItem(product.id, quantity, selectedVariant?.id);
      toast.success("Added to cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const hasSpecs = product.attributes && typeof product.attributes === 'object' && Object.keys(product.attributes).length > 0;

  return (
    <div className="site-container py-6 page-enter">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)]">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[var(--accent)]">Products</Link>
        {product.category_name && (
          <>
            <span>/</span>
            <Link href={`/products?category_id=${product.category_id}`} className="hover:text-[var(--accent)]">
              {product.category_name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-wxs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 mb-16">
        {/* Gallery */}
        <div>
          <ImageGallery
            images={galleryImages}
            alt={product.name}
            activeIndex={galleryIdx}
            onIndexChange={setGalleryIdx}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-6">
            {product.is_featured && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-[var(--brand-bg)] text-[var(--brand)] px-2.5 py-1 rounded-md mb-3 tracking-wider">
                <Zap className="w-3 h-3" /> Featured Item
              </span>
            )}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-[1.2]">{product.name}</h1>

            <div className="flex items-center gap-4 text-sm mb-4">
              {product.average_rating > 0 && (
                <div className="flex items-center gap-1 text-[var(--star-filled)] pr-4 border-r border-[var(--border)]">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-semibold text-[var(--text-primary)]">{product.average_rating.toFixed(1)}</span>
                  <span className="text-[var(--text-muted)]">({product.review_count} Reviews)</span>
                </div>
              )}
              {currentStock > 0 ? (
                <span className="flex items-center gap-1.5 text-[var(--success)] font-medium">
                  <Check className="w-4 h-4" /> In Stock ({currentStock})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[var(--danger)] font-medium">
                  <X className="w-4 h-4" /> Out of Stock
                </span>
              )}
            </div>

            <div className="flex items-end gap-3 mb-6">
              <span className="text-3xl font-bold text-[var(--accent)]">
                {formatPrice(ep.current)}
              </span>
              {ep.original && (
                <>
                  <span className="text-lg text-[var(--text-muted)] line-through mb-1">
                    {formatPrice(ep.original)}
                  </span>
                  <span className="text-sm font-semibold text-[var(--danger)] mb-1.5">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            <div className="prose prose-sm text-[var(--text-secondary)] line-clamp-3 mb-6">
              {product.description}
            </div>
          </div>

          <div className="w-full h-px bg-[var(--border)] mb-6" />

          {/* Variants */}
          {isVariable && product.option_groups && (
            <div className="mb-6">
              <VariantSelector
                product={product as Product}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
              />
            </div>
          )}

          {/* Action Area */}
          <div className="bg-[var(--bg-tertiary)] rounded-2xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius)] h-12">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)]"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, currentStock)}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(currentStock, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-12 h-full bg-transparent text-center font-medium outline-none text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="w-10 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)]"
                  disabled={quantity >= currentStock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0 || (isVariable && !selectedVariant)}
                className="flex-1 btn-primary h-12 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                {currentStock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>

              <button
                onClick={async () => {
                  try {
                    await api.post("/wishlist/items", { product_id: product.id });
                    toast.success("Added to wishlist!");
                  } catch { toast.error("Login required or already in wishlist"); }
                }}
                className="btn-icon h-12 w-12 flex-shrink-0 bg-[var(--bg-secondary)]"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">Fast Delivery</p>
                <p className="text-[10px] text-[var(--text-muted)]">Inside Dhaka 24hrs</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">100% Authentic</p>
                <p className="text-[10px] text-[var(--text-muted)]">Brand Warranty</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">7 Days Return</p>
                <p className="text-[10px] text-[var(--text-muted)]">If goods have problems</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 bg-white shadow-sm border border-[var(--border)]">
                <Share2 className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">Share Product</p>
                <p className="text-[10px] text-[var(--text-muted)]">Copy link</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card-static rounded-2xl overflow-hidden mb-16">
        <div className="tab-list px-4 bg-[var(--bg-tertiary)]">
          <button onClick={() => setActiveTab("description")} className={`tab-item ${activeTab === "description" ? "active" : ""}`}>
            Overview
          </button>
          {hasSpecs && (
            <button onClick={() => setActiveTab("specs")} className={`tab-item ${activeTab === "specs" ? "active" : ""}`}>
              Specifications
            </button>
          )}
          <button onClick={() => setActiveTab("reviews")} className={`tab-item ${activeTab === "reviews" ? "active" : ""}`}>
            Reviews ({product.review_count})
          </button>
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === "description" && (
              <motion.div key="desc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="prose prose-sm md:prose-base max-w-none text-[var(--text-secondary)]">
                <div dangerouslySetInnerHTML={{ __html: product.description?.replace(/\n/g, "<br/>") || "" }} />
              </motion.div>
            )}

            {activeTab === "specs" && hasSpecs && (
              <motion.div key="specs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <table className="spec-table border border-[var(--border)] rounded-xl overflow-hidden">
                  <tbody>
                    {Object.entries(product.attributes!).map(([k, v], i) => (
                      <tr key={k} className={i % 2 === 0 ? "bg-[var(--bg-secondary)]" : "bg-[var(--bg-tertiary)]"}>
                        <td className="w-1/3 py-3 px-4 font-semibold text-[var(--text-secondary)] border-r border-[var(--border)]">{k}</td>
                        <td className="w-2/3 py-3 px-4">{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ReviewSection productId={product.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {related.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
