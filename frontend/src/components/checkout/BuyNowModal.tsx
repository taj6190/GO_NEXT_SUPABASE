/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import api from "@/lib/api";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { useAuthStore, useCartStore, useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck, Truck, X, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface CheckoutForm {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  paymentMethod: "cod" | "bkash" | "nagad";
}

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", available: true },
  { id: "bkash", label: "bKash", available: false },
  { id: "nagad", label: "Nagad", available: false },
] as const;

export default function BuyNowModal() {
  const router = useRouter();
  const { buyNowProduct, setBuyNowProduct } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: "",
    address_line1: "",
    paymentMethod: "cod",
  });

  if (!buyNowProduct) return null;

  const shippingCost = 60;
  const ep = getEffectivePrice(
    buyNowProduct.price,
    buyNowProduct.discount_price,
  );
  const subtotal = ep.current * buyNowProduct.quantity;
  const total = subtotal + shippingCost;
  const hasDiscount = ep.original != null && ep.original > ep.current;

  const handleClose = () => setBuyNowProduct(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    try {
      await addItem(
        buyNowProduct.id,
        buyNowProduct.quantity,
        buyNowProduct.variantId,
      );

      let addressId: string | undefined;
      if (form.address_line1.trim()) {
        const { data: addrData } = await api.post("/addresses", {
          full_name: form.full_name,
          phone: form.phone,
          address_line1: form.address_line1,
          city: "Dhaka",
          district: "Dhaka",
          postal_code: "",
          is_default: true,
        });
        if (addrData.success) addressId = addrData.data?.id;
      }

      const orderPayload: Record<string, unknown> = {
        payment_method: form.paymentMethod,
        ...(addressId && { shipping_address_id: addressId }),
        ...(!isAuthenticated && {
          guest_email: form.email || "",
          guest_phone: form.phone,
        }),
      };

      const { data } = await api.post("/orders", orderPayload);
      if (data.success) {
        toast.success("Order placed successfully!");
        handleClose();
        isAuthenticated
          ? router.push("/orders")
          : router.push(
              `/order-confirmation?order=${data.data?.order_number}${form.email ? `&email=${encodeURIComponent(form.email)}` : ""}`,
            );
      } else {
        toast.error(data.error || "Failed to place order");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {buyNowProduct && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#1a1916]/70 z-[99] backdrop-blur-[2px]"
          />

          {/* ── Modal ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-auto md:w-full md:max-w-[900px] max-h-[92svh] bg-[#faf8f5] z-[100] flex flex-col md:flex-row overflow-hidden [font-family:'DM_Sans',sans-serif]"
            style={{ border: "1.5px solid #ede9e2" }}
          >
            {/* ══════════════════════════════
                LEFT PANEL — Order Summary
            ══════════════════════════════ */}
            <div className="w-full md:w-[280px] flex-shrink-0 bg-[#1a1916] flex flex-col">
              {/* Header */}
              <div className="px-6 pt-6 pb-5 border-b border-[#2a2824] flex items-center justify-between">
                <div>
                  <p className="text-[9.5px] font-semibold tracking-[0.18em] uppercase text-[#c9a96e] mb-0.5">
                    Quick Checkout
                  </p>
                  <h2 className="text-[16px] font-normal text-[#f5f0e8] [font-family:'Instrument_Serif',serif] leading-tight">
                    Order Summary
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 text-[#6b6560] hover:text-[#f5f0e8] hover:bg-[#2a2824] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product */}
              <div className="px-6 py-5 border-b border-[#2a2824]">
                {/* Image */}
                <div
                  className="w-full aspect-square bg-[#faf8f5] mb-4 flex items-center justify-center overflow-hidden"
                  style={{ border: "1px solid #2a2824" }}
                >
                  <Image
                    src={
                      buyNowProduct.image_url ||
                      "https://via.placeholder.com/200"
                    }
                    alt={buyNowProduct.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-contain p-3"
                  />
                </div>

                <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-[#c9a96e] mb-1">
                  Qty: {buyNowProduct.quantity}
                </p>
                <h3 className="text-[13px] font-medium text-[#f5f0e8] leading-snug line-clamp-3">
                  {buyNowProduct.name}
                </h3>
              </div>

              {/* Price breakdown */}
              <div className="px-6 py-5 flex flex-col gap-2.5 border-b border-[#2a2824]">
                {hasDiscount && (
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#6b6560] font-light">Original</span>
                    <span className="text-[#6b6560] line-through">
                      {formatPrice(ep.original! * buyNowProduct.quantity)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#a09a8e] font-light">Subtotal</span>
                  <span className="text-[#f5f0e8] font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#a09a8e] font-light">Shipping</span>
                  <span className="text-[#f5f0e8] font-medium">
                    {formatPrice(shippingCost)}
                  </span>
                </div>
                {/* Total */}
                <div
                  className="pt-3 flex items-end justify-between"
                  style={{ borderTop: "1px solid #2a2824" }}
                >
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#6b6560]">
                    Total
                  </span>
                  <span className="text-[22px] font-normal text-[#c9a96e] [font-family:'Instrument_Serif',serif] leading-none">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="px-6 py-5 mt-auto flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#c9a96e] flex-shrink-0" />
                  <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#6b6560]">
                    Secure Checkout
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Truck className="w-3.5 h-3.5 text-[#c9a96e] flex-shrink-0" />
                  <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#6b6560]">
                    Fast Delivery
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Zap
                    className="w-3.5 h-3.5 text-[#c9a96e] flex-shrink-0"
                    fill="currentColor"
                  />
                  <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#6b6560]">
                    Instant Confirmation
                  </span>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════
                RIGHT PANEL — Form
            ══════════════════════════════ */}
            <div className="flex-1 overflow-y-auto bg-[#faf8f5]">
              <div className="px-6 md:px-10 py-7">
                {/* Form header */}
                <div className="mb-7">
                  <p className="text-[9.5px] font-semibold tracking-[0.18em] uppercase text-[#c9a96e] mb-0.5 flex items-center gap-2">
                    <span className="inline-block w-4 h-px bg-[#c9a96e]" />
                    Delivery
                  </p>
                  <h2 className="text-[22px] font-normal text-[#1a1916] [font-family:'Instrument_Serif',serif] leading-tight">
                    Shipping Details
                  </h2>
                  <p className="text-[12px] text-[#9a9086] font-light mt-1">
                    Fill in your delivery information to complete the order.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Name + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#6b6258]">
                        Full Name <span className="text-[#c9a96e]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.full_name}
                        onChange={(e) =>
                          setForm({ ...form, full_name: e.target.value })
                        }
                        placeholder="Your full name"
                        disabled={loading}
                        className="h-11 px-3.5 bg-white text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all disabled:opacity-50"
                        style={{ border: "1.5px solid #e8e2d9" }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#c9a96e";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(201,169,110,0.1)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#e8e2d9";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#6b6258]">
                        Phone <span className="text-[#c9a96e]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="01700-000000"
                        disabled={loading}
                        className="h-11 px-3.5 bg-white text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all disabled:opacity-50"
                        style={{ border: "1.5px solid #e8e2d9" }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#c9a96e";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 3px rgba(201,169,110,0.1)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#e8e2d9";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#9a9086]">
                      Email{" "}
                      <span className="text-[10px] font-normal normal-case tracking-normal text-[#c4bcb2]">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="you@example.com"
                      disabled={loading}
                      className="h-11 px-3.5 bg-white text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all disabled:opacity-50"
                      style={{ border: "1.5px solid #e8e2d9" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#c9a96e";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(201,169,110,0.1)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#e8e2d9";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#9a9086]">
                      Delivery Address{" "}
                      <span className="text-[10px] font-normal normal-case tracking-normal text-[#c4bcb2]">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={form.address_line1}
                      onChange={(e) =>
                        setForm({ ...form, address_line1: e.target.value })
                      }
                      placeholder="House #, Road #, Area, City"
                      disabled={loading}
                      rows={3}
                      className="px-3.5 py-3 bg-white text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all resize-none disabled:opacity-50 leading-relaxed"
                      style={{ border: "1.5px solid #e8e2d9" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#c9a96e";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(201,169,110,0.1)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#e8e2d9";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Payment method */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#6b6258]">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = form.paymentMethod === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`relative flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 cursor-pointer transition-all duration-150 text-center ${
                              !method.available
                                ? "opacity-40 cursor-not-allowed bg-[#f5f1eb]"
                                : isSelected
                                  ? "bg-[#1a1916] cursor-pointer"
                                  : "bg-white hover:bg-[#faf8f5] cursor-pointer"
                            }`}
                            style={{
                              border:
                                isSelected && method.available
                                  ? "1.5px solid #1a1916"
                                  : "1.5px solid #e8e2d9",
                            }}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              className="sr-only"
                              checked={isSelected}
                              disabled={loading || !method.available}
                              onChange={() => {
                                if (method.available)
                                  setForm({
                                    ...form,
                                    paymentMethod: method.id as any,
                                  });
                              }}
                            />

                            <span
                              className={`text-[11px] font-semibold tracking-[0.06em] transition-colors ${
                                !method.available
                                  ? "text-[#b0a898]"
                                  : isSelected
                                    ? "text-[#c9a96e]"
                                    : "text-[#1a1916]"
                              }`}
                            >
                              {method.label}
                            </span>

                            {!method.available && (
                              <span className="text-[8px] font-semibold tracking-[0.08em] uppercase bg-[#f0e9db] text-[#c9a96e] px-1.5 py-0.5">
                                Soon
                              </span>
                            )}

                            {/* Selected indicator dot */}
                            {isSelected && method.available && (
                              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#c9a96e]" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#ede9e2]" />

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full h-13 flex items-center justify-center gap-2.5 bg-[#c9a96e] hover:bg-[#1a1916] disabled:opacity-60 disabled:cursor-not-allowed text-[#1a1916] hover:text-[#f5f0e8] text-[12px] font-semibold tracking-[0.1em] uppercase transition-all duration-200 overflow-hidden group"
                    style={{ height: "52px", border: "1.5px solid #1a1916" }}
                  >
                    {/* Shimmer overlay */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />

                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Placing Order…
                      </>
                    ) : (
                      <>
                        Complete Order
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Fine print */}
                  <p className="text-center text-[10.5px] text-[#b0a898] font-light leading-relaxed">
                    By placing this order you agree to our{" "}
                    <span className="text-[#9a9086] underline underline-offset-2 cursor-pointer">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="text-[#9a9086] underline underline-offset-2 cursor-pointer">
                      Refund Policy
                    </span>
                    .
                  </p>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
