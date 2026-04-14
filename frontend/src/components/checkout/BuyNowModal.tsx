/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import api from "@/lib/api";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { useAuthStore, useCartStore, useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
  Truck,
  X,
  Zap,
} from "lucide-react";
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
  const [summaryOpen, setSummaryOpen] = useState(false); // mobile accordion
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

  /* ─── Shared field styles ─── */
  const inputCls =
    "w-full h-11 px-3.5 bg-white text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all disabled:opacity-50 [font-family:'DM_Sans',sans-serif]";
  const inputStyle = { border: "1.5px solid #e8e2d9" };
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "#c9a96e";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,169,110,0.1)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "#e8e2d9";
      e.currentTarget.style.boxShadow = "none";
    },
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

          {/* ══════════════════════════════════════════════════════
              MODAL SHELL
              Mobile  : full-screen bottom sheet, slides up
              Desktop : centered two-column panel
          ══════════════════════════════════════════════════════ */}
          <motion.div
            /* Mobile: full screen bottom sheet */
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={[
              /* Mobile/tablet — full-screen bottom sheet */
              "fixed inset-x-0 bottom-0 z-[100] flex flex-col bg-[#faf8f5] [font-family:'DM_Sans',sans-serif]",
              "max-h-[96svh]",
              /* Desktop — centered two-column modal */
              "md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
              "md:flex-row md:max-h-[90vh] md:w-full md:max-w-[900px]",
            ].join(" ")}
            style={{ border: "1.5px solid #ede9e2" }}
          >
            {/* ════════════════════════════════════════
                MOBILE: Compact sticky summary header
                Hidden on md+
            ════════════════════════════════════════ */}
            <div
              className="md:hidden flex-shrink-0 bg-[#1a1916]"
              style={{ borderBottom: "1px solid #2a2824" }}
            >
              {/* Top row: product thumb + price + close + toggle */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Thumb */}
                <div
                  className="w-12 h-12 flex-shrink-0 bg-[#faf8f5] flex items-center justify-center overflow-hidden"
                  style={{ border: "1px solid #2a2824" }}
                >
                  <Image
                    src={
                      buyNowProduct.image_url ||
                      "https://via.placeholder.com/48"
                    }
                    alt={buyNowProduct.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain p-0.5"
                  />
                </div>

                {/* Name + total */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#f5f0e8] line-clamp-1 leading-tight">
                    {buyNowProduct.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[#6b6560]">
                      Qty {buyNowProduct.quantity}
                    </span>
                    <span className="text-[11px] text-[#3a3836]">·</span>
                    <span className="text-[14px] font-semibold text-[#c9a96e] [font-family:'Instrument_Serif',serif]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {/* Expand toggle */}
                <button
                  type="button"
                  onClick={() => setSummaryOpen(!summaryOpen)}
                  className="p-1.5 text-[#6b6560] hover:text-[#c9a96e] transition-colors flex-shrink-0"
                  aria-label="Toggle summary"
                >
                  {summaryOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 text-[#6b6560] hover:text-[#f5f0e8] transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Expandable price breakdown */}
              <AnimatePresence>
                {summaryOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 pb-4 flex flex-col gap-2"
                      style={{
                        borderTop: "1px solid #2a2824",
                        paddingTop: "12px",
                      }}
                    >
                      {hasDiscount && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#6b6560]">Original</span>
                          <span className="text-[#6b6560] line-through">
                            {formatPrice(ep.original! * buyNowProduct.quantity)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#a09a8e]">Subtotal</span>
                        <span className="text-[#f5f0e8]">
                          {formatPrice(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#a09a8e]">Shipping</span>
                        <span className="text-[#f5f0e8]">
                          {formatPrice(shippingCost)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between text-[12px] pt-2"
                        style={{ borderTop: "1px solid #2a2824" }}
                      >
                        <span className="font-semibold text-[#9a9086] uppercase tracking-[0.08em] text-[10px]">
                          Total
                        </span>
                        <span className="text-[16px] font-normal text-[#c9a96e] [font-family:'Instrument_Serif',serif]">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ════════════════════════════════════════
                DESKTOP: Full left panel
                Hidden on mobile (md:flex)
            ════════════════════════════════════════ */}
            <div className="hidden md:flex w-[280px] flex-shrink-0 bg-[#1a1916] flex-col">
              {/* Panel header */}
              <div
                className="px-6 pt-6 pb-5 flex items-center justify-between"
                style={{ borderBottom: "1px solid #2a2824" }}
              >
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
              <div
                className="px-6 py-5"
                style={{ borderBottom: "1px solid #2a2824" }}
              >
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
              <div
                className="px-6 py-5 flex flex-col gap-2.5"
                style={{ borderBottom: "1px solid #2a2824" }}
              >
                {hasDiscount && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#6b6560] font-light">Original</span>
                    <span className="text-[#6b6560] line-through">
                      {formatPrice(ep.original! * buyNowProduct.quantity)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#a09a8e] font-light">Subtotal</span>
                  <span className="text-[#f5f0e8] font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#a09a8e] font-light">Shipping</span>
                  <span className="text-[#f5f0e8] font-medium">
                    {formatPrice(shippingCost)}
                  </span>
                </div>
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
                {[
                  { icon: ShieldCheck, label: "Secure Checkout" },
                  { icon: Truck, label: "Fast Delivery" },
                  { icon: Zap, label: "Instant Confirmation" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-[#c9a96e] flex-shrink-0" />
                    <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#6b6560]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ════════════════════════════════════════
                FORM PANEL — full width on mobile,
                flex-1 on desktop
            ════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto bg-[#faf8f5] min-h-0">
              <div className="px-5 py-6 md:px-10 md:py-8">
                {/* Form header */}
                <div className="mb-6">
                  <p className="text-[9.5px] font-semibold tracking-[0.18em] uppercase text-[#c9a96e] mb-1 flex items-center gap-2">
                    <span className="inline-block w-4 h-px bg-[#c9a96e]" />
                    Delivery
                  </p>
                  <h2 className="text-[20px] md:text-[22px] font-normal text-[#1a1916] [font-family:'Instrument_Serif',serif] leading-tight">
                    Shipping Details
                  </h2>
                  <p className="text-[12px] text-[#9a9086] font-light mt-1">
                    All fields marked <span className="text-[#c9a96e]">*</span>{" "}
                    are required.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Name + Phone — stack on mobile, grid on sm+ */}
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
                        className={inputCls}
                        style={inputStyle}
                        {...focusHandlers}
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
                        className={inputCls}
                        style={inputStyle}
                        {...focusHandlers}
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
                      className={inputCls}
                      style={inputStyle}
                      {...focusHandlers}
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
                      className="w-full px-3.5 py-3 bg-white text-[13px] text-[#1a1916] placeholder:text-[#c4bcb2] outline-none transition-all resize-none disabled:opacity-50 leading-relaxed [font-family:'DM_Sans',sans-serif]"
                      style={inputStyle}
                      {...focusHandlers}
                    />
                  </div>

                  {/* Payment method */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#6b6258]">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = form.paymentMethod === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 text-center transition-all duration-150 ${
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
                              className={`text-[11px] font-semibold tracking-[0.04em] transition-colors leading-tight ${
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
                            {isSelected && method.available && (
                              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#c9a96e]" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile-only: trust badges inline before button */}
                  <div className="md:hidden flex items-center justify-center gap-5 py-2">
                    {[
                      { icon: ShieldCheck, label: "Secure" },
                      { icon: Truck, label: "Fast Delivery" },
                      { icon: Zap, label: "Instant" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-[#c9a96e] flex-shrink-0" />
                        <span className="text-[9.5px] font-medium text-[#9a9086] uppercase tracking-[0.06em]">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#ede9e2]" />

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full flex items-center justify-center gap-2.5 bg-[#c9a96e] hover:bg-[#1a1916] disabled:opacity-60 disabled:cursor-not-allowed text-[#1a1916] hover:text-[#f5f0e8] text-[12px] font-semibold tracking-[0.1em] uppercase transition-all duration-200 overflow-hidden group [font-family:'DM_Sans',sans-serif]"
                    style={{ height: "52px", border: "1.5px solid #1a1916" }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Placing
                        Order…
                      </>
                    ) : (
                      <>
                        Complete Order{" "}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Fine print */}
                  <p className="text-center text-[10.5px] text-[#b0a898] font-light leading-relaxed pb-2">
                    By placing this order you agree to our{" "}
                    <span className="text-[#9a9086] underline underline-offset-2 cursor-pointer">
                      Terms
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
