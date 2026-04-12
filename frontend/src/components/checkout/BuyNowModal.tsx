/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import api from "@/lib/api";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { useAuthStore, useCartStore, useUIStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, ShieldCheck, Truck, X } from "lucide-react";
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
  const { addItem, clearCart, fetchCart } = useCartStore();
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

    if (!form.full_name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Add item to cart
      await addItem(
        buyNowProduct.id,
        buyNowProduct.quantity,
        buyNowProduct.variantId,
      );

      // Step 2: Create/update shipping address (only if address provided)
      let addressId: string | undefined;

      if (form.address_line1.trim()) {
        const { data: addrData } = await api.post("/addresses", {
          full_name: form.full_name,
          phone: form.phone,
          address_line1: form.address_line1,
          city: "Dhaka", // Default city
          district: "Dhaka", // Default district
          postal_code: "",
          is_default: true,
        });

        if (!addrData.success) {
          toast.error(addrData.error || "Failed to save address");
          setLoading(false);
          return;
        }

        addressId = addrData.data?.id;
      }

      // Step 3: Create order using the cart items
      const orderPayload: Record<string, unknown> = {
        payment_method: form.paymentMethod,
      };

      // Add address only if it exists
      if (addressId) {
        orderPayload.shipping_address_id = addressId;
      }

      // Add guest info if not authenticated
      if (!isAuthenticated) {
        orderPayload.guest_email = form.email || "";
        orderPayload.guest_phone = form.phone;
      }

      const { data } = await api.post("/orders", orderPayload);

      if (data.success) {
        toast.success("Order placed successfully!");
        handleClose();

        const orderNumber = data.data?.order_number;

        // Redirect based on user type
        if (isAuthenticated) {
          // Authenticated users go to orders page
          router.push("/orders");
        } else {
          // Guest users go to confirmation page with email
          const confirmUrl = `/order-confirmation?order=${orderNumber}${
            form.email ? `&email=${encodeURIComponent(form.email)}` : ""
          }`;
          router.push(confirmUrl);
        }
      } else {
        toast.error(data.error || "Failed to place order");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Failed to place order";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {buyNowProduct && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-[99]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl z-[100] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-black">Quick Checkout</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Complete your purchase in seconds
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Product Summary */}
              <div className="bg-neutral-50 rounded-2xl p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-neutral-200">
                    <Image
                      src={
                        buyNowProduct.image_url ||
                        "https://via.placeholder.com/80"
                      }
                      alt={buyNowProduct.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-black line-clamp-2">
                      {buyNowProduct.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-2">
                      Qty: {buyNowProduct.quantity}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-[#ef4a23]">
                        {formatPrice(ep.current * buyNowProduct.quantity)}
                      </span>
                      {ep.original && (
                        <span className="text-xs text-neutral-500 line-through">
                          {formatPrice(
                            (ep.original as number) * buyNowProduct.quantity,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 bg-neutral-50 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Subtotal</span>
                  <span className="font-semibold text-black">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Shipping</span>
                  <span className="font-semibold text-black">
                    {formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-2 flex justify-between items-center">
                  <span className="font-bold text-black">Total</span>
                  <span className="text-xl font-bold text-[#ef4a23]">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-black mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef4a23] text-sm"
                    placeholder="Your full name"
                    disabled={loading}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-black mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef4a23] text-sm"
                    placeholder="01700000000"
                    disabled={loading}
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-2">
                    Email{" "}
                    <span className="text-xs text-neutral-500">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef4a23] text-sm"
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>

                {/* Address (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-2">
                    Delivery Address{" "}
                    <span className="text-xs text-neutral-500">(optional)</span>
                  </label>
                  <textarea
                    value={form.address_line1}
                    onChange={(e) =>
                      setForm({ ...form, address_line1: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef4a23] text-sm resize-none h-20"
                    placeholder="Your full address"
                    disabled={loading}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-black mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        value: "cod",
                        label: "Cash on Delivery (COD)",
                        icon: "📦",
                      },
                      {
                        value: "bkash",
                        label: "bKash",
                        icon: "📱",
                      },
                      {
                        value: "nagad",
                        label: "Nagad",
                        icon: "📱",
                      },
                    ].map((method) => (
                      <label
                        key={method.value}
                        className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={form.paymentMethod === method.value}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              paymentMethod: e.target.value as any,
                            })
                          }
                          className="w-4 h-4 cursor-pointer"
                          disabled={loading}
                        />
                        <span className="text-lg">{method.icon}</span>
                        <span className="text-sm font-semibold text-black">
                          {method.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span className="text-neutral-700">Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span className="text-neutral-700">Fast Delivery</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-linear-to-r from-[#ef4a23] to-[#d63516] text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Place Order Now
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
