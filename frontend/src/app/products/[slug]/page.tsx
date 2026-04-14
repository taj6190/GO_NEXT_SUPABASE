/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import WhatsAppButton from "@/components/contact/WhatsAppButton";
import ImageGallery from "@/components/product/ImageGallery";
import ProductCard from "@/components/product/ProductCard";
import ReviewSection from "@/components/product/ReviewSection";
import VariantSelector from "@/components/product/VariantSelector";
import api from "@/lib/api";
import { Product, Variant } from "@/lib/types";
import {
  formatPrice,
  getDiscountPercent,
  getEffectivePrice,
  hasVariants,
} from "@/lib/utils";
import { useAuthStore, useCartStore, useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  Star,
  Truck,
  X,
} from "lucide-react";
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
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);

  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuthStore();
  const { setBuyNowProduct } = useUIStore();

  useEffect(() => {
    if (slug) {
      setLoading(true);
      api
        .get(`/products/${slug}`)
        .then(({ data }) => {
          if (data.success) {
            setProduct(data.data);
            if (data.data.variants?.length > 0) {
              const firstVariant = data.data.variants[0];
              setSelectedVariant(firstVariant);
              const opts: Record<string, string> = {};
              firstVariant.options?.forEach(
                (o: { option_group_id: string; option_value_id: string }) => {
                  opts[o.option_group_id] = o.option_value_id;
                },
              );
              setSelectedOptions(opts);
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      api
        .get(`/products/${slug}/related`)
        .then(({ data }) => {
          if (data.success) setRelated(data.data || []);
        })
        .catch(() => {});
    }
  }, [slug]);

  const handleOptionChange = useCallback(
    (groupId: string, valueId: string) => {
      const newOptions = { ...selectedOptions, [groupId]: valueId };
      setSelectedOptions(newOptions);

      if (product?.variants) {
        const match = product.variants.find((v) => {
          if (!v.options) return false;
          return Object.entries(newOptions).every(([gId, vId]) =>
            v.options.some(
              (o) => o.option_group_id === gId && o.option_value_id === vId,
            ),
          );
        });
        setSelectedVariant(match || null);

        if (match?.images?.length) {
          setGalleryIdx(0);
        }
      }
    },
    [selectedOptions, product],
  );

  const galleryImages = useMemo(() => {
    if (selectedVariant?.images?.length) {
      return selectedVariant.images.map((img) => ({
        id: img.id,
        image_url: img.image_url,
        is_primary: img.is_primary,
      }));
    }
    return product?.images || [];
  }, [selectedVariant, product]);

  const isVariable = product ? hasVariants(product) : false;
  const currentPrice = selectedVariant
    ? selectedVariant.price
    : product?.price || "0";
  const currentDiscountPrice = selectedVariant
    ? selectedVariant.discount_price
    : product?.discount_price || "0";
  const currentStock = product
    ? selectedVariant
      ? selectedVariant.stock_quantity
      : product.stock_quantity
    : 0;

  const ep = getEffectivePrice(currentPrice, currentDiscountPrice);
  const discount = getDiscountPercent(currentPrice, currentDiscountPrice);
  const hasSpecs =
    product?.attributes &&
    typeof product.attributes === "object" &&
    Object.keys(product.attributes).length > 0;

  if (loading) {
    return (
      <div className="site-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
          <div className="aspect-square skeleton" />
          <div className="space-y-6 pt-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/4" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="site-container text-center py-20">
        <p className="text-xl text-[var(--text-secondary)] font-['DM_Sans',sans-serif]">
          Product not found
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex bg-[var(--text-primary)] text-[var(--bg-primary)] px-8 py-3 text-sm tracking-widest uppercase font-semibold hover:opacity-90 transition-opacity"
        >
          Browse Collection
        </Link>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (isVariable && !selectedVariant)
      return toast.error("Please select all options");
    if (currentStock < quantity) return toast.error("Not enough stock");

    try {
      await addItem(product.id, quantity, selectedVariant?.id);
      toast.success("Added to your cart");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  const handleBuyNow = () => {
    if (isVariable && !selectedVariant)
      return toast.error("Please select all options");
    if (currentStock < quantity) return toast.error("Not enough stock");

    setBuyNowProduct({
      id: product.id,
      name: product.name,
      price: currentPrice,
      discount_price: currentDiscountPrice,
      image_url:
        galleryImages[galleryIdx]?.image_url ||
        product.images?.[0]?.image_url ||
        "",
      quantity,
      variantId: selectedVariant?.id,
    });
  };

  return (
    <div className="site-container py-8 md:py-12 page-enter">
      {/* Breadcrumbs - Minimalist */}
      <nav className="flex items-center gap-2.5 text-[10px] font-semibold tracking-[0.15em] text-[var(--text-secondary)] uppercase mb-10 [font-family:'DM_Sans',sans-serif]">
        <Link
          href="/"
          className="hover:text-[var(--text-primary)] transition-colors"
        >
          Home
        </Link>
        <span className="text-[var(--border)]">/</span>
        <Link
          href="/products"
          className="hover:text-[var(--text-primary)] transition-colors"
        >
          Products
        </Link>
        {product.category_name && (
          <>
            <span className="text-[var(--border)]">/</span>
            <Link
              href={`/products?category_id=${product.category_id}`}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              {product.category_name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-start mb-24">
        {/* Gallery - Sticky Column */}
        <div className="md:sticky md:top-24">
          <ImageGallery
            images={galleryImages}
            alt={product.name}
            activeIndex={galleryIdx}
            onIndexChange={setGalleryIdx}
          />
        </div>

        {/* Info Container */}
        <div className="flex flex-col">
          {/* Header Section */}
          <div className="mb-8 border-b border-[var(--border)] pb-8">
            {product.is_featured && (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] uppercase text-[#c9a96e] mb-4 [font-family:'DM_Sans',sans-serif]">
                <span className="w-4 h-[1px] bg-[#c9a96e]" /> Featured
              </span>
            )}

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-[var(--text-primary)] font-['Instrument_Serif',serif] leading-[1.1] mb-5 tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 text-sm font-['DM_Sans',sans-serif] mb-6">
              {product.average_rating > 0 && (
                <div className="flex items-center gap-1.5 pr-4 border-r border-[var(--border)]">
                  <Star className="w-4 h-4 fill-[#c9a96e] text-[#c9a96e]" />
                  <span className="font-semibold text-[var(--text-primary)]">
                    {product.average_rating.toFixed(1)}
                  </span>
                  <span className="text-[var(--text-secondary)] text-xs underline decoration-dotted underline-offset-4 cursor-pointer hover:text-[var(--text-primary)]">
                    ({product.review_count} Reviews)
                  </span>
                </div>
              )}
              {currentStock > 0 ? (
                <span className="flex items-center gap-1.5 text-green-600 text-xs font-semibold tracking-wider uppercase">
                  <Check className="w-3.5 h-3.5" /> In Stock
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-red-500 text-xs font-semibold tracking-wider uppercase">
                  <X className="w-3.5 h-3.5" /> Sold Out
                </span>
              )}
            </div>

            <div className="flex items-end gap-3 [font-family:'DM_Sans',sans-serif]">
              <span className="text-2xl font-medium text-[var(--text-primary)]">
                {formatPrice(ep.current)}
              </span>
              {ep.original && (
                <>
                  <span className="text-sm text-[var(--text-muted)] line-through mb-1">
                    {formatPrice(ep.original)}
                  </span>
                  <span className="bg-[#1a1916] text-[#c9a96e] text-[10px] font-bold px-2 py-1 uppercase tracking-widest mb-1 ml-2">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-8 [font-family:'DM_Sans',sans-serif] font-light">
            {product.description}
          </div>

          {/* Variants */}
          {isVariable && product.option_groups && (
            <div className="mb-8">
              <VariantSelector
                product={product as Product}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
              />
            </div>
          )}

          {/* Actions Container */}
          <div className="flex flex-col gap-4 mb-10 [font-family:'DM_Sans',sans-serif]">
            {/* Quantity Selector */}
            <div className="flex items-center mb-2">
              <p className="text-[11px] font-semibold tracking-widest text-[var(--text-secondary)] uppercase w-24">
                Quantity
              </p>
              <div className="flex items-center border border-[var(--border)] h-11 w-32">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, currentStock)}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.min(
                        currentStock,
                        Math.max(1, parseInt(e.target.value) || 1),
                      ),
                    )
                  }
                  className="w-full h-full bg-transparent text-center text-sm font-medium outline-none text-[var(--text-primary)] appearance-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(Math.min(currentStock, quantity + 1))
                  }
                  className="w-10 h-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  disabled={quantity >= currentStock}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={
                  currentStock === 0 || (isVariable && !selectedVariant)
                }
                className="flex-1 h-14 bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold tracking-[0.1em] uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              >
                {currentStock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={
                  currentStock === 0 || (isVariable && !selectedVariant)
                }
                className="flex-1 h-14 bg-[#c9a96e] text-[#1a1916] text-xs font-bold tracking-[0.1em] uppercase hover:bg-[#b8944f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {currentStock === 0 ? "Unavailable" : "Buy Now"}
              </button>

              <button
                onClick={async () => {
                  try {
                    await api.post("/wishlist/items", {
                      product_id: product.id,
                    });
                    toast.success("Saved to your wishlist");
                  } catch {
                    toast.error("Please login to save items");
                  }
                }}
                className="h-14 w-14 flex items-center justify-center border border-[var(--border)] text-[var(--text-primary)] hover:border-[#c9a96e] hover:text-[#c9a96e] transition-colors"
                aria-label="Add to Wishlist"
              >
                <Heart className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* WhatsApp Inquiry Button */}
            {product && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3 px-4 sm:px-0">
                  আরও তথ্যের জন্য
                </p>
                <WhatsAppButton
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: currentPrice,
                    discount_price: currentDiscountPrice,
                    image_url:
                      galleryImages[galleryIdx]?.image_url ||
                      product.images?.[0]?.image_url,
                  }}
                  variant="inline"
                  className="w-full sm:w-auto h-12 text-sm"
                />
              </div>
            )}
          </div>

          {/* Delivery & Guarantees - Minimal List */}
          <div className="border-t border-[var(--border)] pt-6 grid grid-cols-2 gap-y-4 gap-x-6 [font-family:'DM_Sans',sans-serif]">
            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 text-[#c9a96e] mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Express Shipping
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Delivery in 24-48 hrs
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-[#c9a96e] mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Authentic Guarantee
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Sourced from brands
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RotateCcw className="w-4 h-4 text-[#c9a96e] mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Easy Returns
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  7-day return window
                </p>
              </div>
            </div>
            <div
              className="flex items-start gap-3 group cursor-pointer"
              onClick={() =>
                navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => toast.success("Link copied!"))
              }
            >
              <Share2 className="w-4 h-4 text-[#c9a96e] mt-0.5 group-hover:text-[var(--text-primary)] transition-colors" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:underline">
                  Share Product
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Copy link
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section - Modern Underline Style */}
      <div className=" mb-20 [font-family:'DM_Sans',sans-serif]">
        <div className="flex gap-8 border-b border-[var(--border)] mb-8 overflow-x-auto no-scrollbar">
          {["description", ...(hasSpecs ? ["specs"] : []), "reviews"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-4 text-xs sm:text-sm font-semibold tracking-widest uppercase transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab === "description"
                  ? "Overview"
                  : tab === "specs"
                    ? "Specifications"
                    : `Reviews (${product.review_count})`}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c9a96e]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ),
          )}
        </div>

        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            {activeTab === "description" && (
              <motion.div
                key="desc"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-[var(--text-secondary)] font-light leading-loose text-sm sm:text-base max-w-3xl"
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: product.description?.replace(/\n/g, "<br/>") || "",
                  }}
                />
              </motion.div>
            )}

            {/* Alternating Colors Table using CSS Variables */}
            {activeTab === "specs" && hasSpecs && (
              <motion.div
                key="specs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="border border-[var(--border)]">
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      {Object.entries(product.attributes!).map(([k, v], i) => (
                        <tr
                          key={k}
                          className={
                            i % 2 === 0
                              ? "bg-[var(--bg-secondary)]"
                              : "bg-[var(--bg-tertiary)]"
                          }
                        >
                          <td className="w-1/3 py-3 px-4 font-medium text-[var(--text-secondary)] border-r border-[var(--border)] text-sm sm:text-base">
                            {k}
                          </td>
                          <td className="w-2/3 py-3 px-4 text-[var(--text-primary)] text-sm sm:text-base">
                            {String(v)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ReviewSection productId={product.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="pt-16 border-t border-[var(--border)]">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl md:text-4xl text-[var(--text-primary)] font-['Instrument_Serif',serif] font-normal tracking-tight">
              Curated for You
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
