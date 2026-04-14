/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import api from "@/lib/api";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { useAuthStore, useCartStore, useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck, Truck, X } from "lucide-react";
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
        if (isAuthenticated) {
          router.push("/orders");
        } else {
          router.push(
            `/order-confirmation?order=${data.data?.order_number}${form.email ? `&email=${encodeURIComponent(form.email)}` : ""}`,
          );
        }
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#1a1916]/60 z-[99] backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-auto max-h-[95vh] bg-white shadow-[20px_20px_0px_0px_#1a1916] z-[100] flex flex-col md:flex-row overflow-hidden border-4 border-[#1a1916]"
          >
            {/* Left Column: Summary (The "Receipt" Look) */}
            <div className="w-full md:w-80 bg-[#faf8f5] border-b-4 md:border-b-0 md:border-r-4 border-[#1a1916] p-6 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-xl font-bold uppercase tracking-tighter text-[#1a1916] font-['DM_Sans',sans-serif]">
                  Order Summary
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-[#1a1916] hover:text-white transition-colors border border-[#1a1916]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 space-y-6">
                <div className="space-y-3">
                  <div className="aspect-square w-full bg-white border-2 border-[#ede9e2] p-2">
                    <Image
                      src={
                        buyNowProduct.image_url ||
                        "https://via.placeholder.com/120"
                      }
                      alt={buyNowProduct.name}
                      width={120}
                      height={120}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="font-['DM_Sans',sans-serif]">
                    <h3 className="font-semibold text-[#1a1916] leading-tight text-sm">
                      {buyNowProduct.name}
                    </h3>
                    <p className="text-[10px] font-medium text-[#9a9086] uppercase tracking-widest">
                      QTY: {buyNowProduct.quantity}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-medium font-['DM_Sans',sans-serif]">
                  <div className="flex justify-between">
                    <span className="text-[#9a9086]">Subtotal</span>
                    <span className="text-[#1a1916]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9a9086]">Shipping</span>
                    <span className="text-[#1a1916]">
                      {formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="pt-4 border-t-2 border-[#ede9e2] flex justify-between items-center">
                    <span className="font-bold uppercase text-[10px] text-[#1a1916]">
                      Total
                    </span>
                    <span className="text-xl font-bold text-[#c9a96e]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#9a9086] font-['DM_Sans',sans-serif]">
                  <ShieldCheck className="w-3 h-3" /> Secure Checkout
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#9a9086] font-['DM_Sans',sans-serif]">
                  <Truck className="w-3 h-3" /> Express Delivery
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white font-['DM_Sans',sans-serif]">
              <div className="max-w-lg mx-auto">
                <header className="mb-8">
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#1a1916]">
                    Shipping Details
                  </h2>
                  <p className="text-[#9a9086] text-xs mt-1">
                    Please provide your delivery information
                  </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1916]">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.full_name}
                        onChange={(e) =>
                          setForm({ ...form, full_name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-[#ede9e2] focus:border-[#c9a96e] outline-none transition-colors text-xs font-medium text-[#1a1916]"
                        placeholder="John Doe"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1916]">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-[#ede9e2] focus:border-[#c9a96e] outline-none transition-colors text-xs font-medium text-[#1a1916]"
                        placeholder="01700000000"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9a9086]">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-[#ede9e2] focus:border-[#c9a96e] outline-none transition-colors text-xs font-medium text-[#1a1916]"
                      placeholder="john@example.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9a9086]">
                      Delivery Address
                    </label>
                    <textarea
                      value={form.address_line1}
                      onChange={(e) =>
                        setForm({ ...form, address_line1: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-[#ede9e2] focus:border-[#c9a96e] outline-none transition-colors text-xs font-medium text-[#1a1916] resize-none h-24"
                      placeholder="House #, Road #, Area, City"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1916]">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {["cod", "bkash", "nagad"].map((method) => (
                        <label
                          key={method}
                          className={`
                            relative cursor-pointer border transition-all p-3 text-center
                            ${
                              form.paymentMethod === method
                                ? "border-[#1a1916] bg-[#1a1916] text-[#faf8f5]"
                                : "border-[#ede9e2] bg-white text-[#1a1916] hover:border-[#c9a96e]"
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            className="hidden"
                            value={method}
                            checked={form.paymentMethod === method}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                paymentMethod: e.target.value as any,
                              })
                            }
                            disabled={loading}
                          />
                          <span className="text-[10px] font-bold uppercase">
                            {method}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full group relative bg-[#c9a96e] text-[#1a1916] font-bold uppercase tracking-widest py-4 transition-all hover:bg-[#1a1916] hover:text-white disabled:opacity-50 flex items-center justify-center gap-3 border-2 border-[#1a1916] shadow-[4px_4px_0px_0px_#1a1916] active:translate-x-1 active:translate-y-1 active:shadow-none text-xs"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Complete Order{" "}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
