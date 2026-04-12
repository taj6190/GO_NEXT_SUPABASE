"use client";

import api from "@/lib/api";
import { formatPrice, getCartItemImage, getEffectivePrice } from "@/lib/utils";
import { useAuthStore, useCartStore } from "@/store";
import {
  Check,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface CheckoutForm {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  paymentMethod: "cod" | "bkash" | "nagad";
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    getSubtotal,
    isLoading: cartLoading,
    clearCart,
    fetchCart,
  } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    full_name: "",
    email: "",
    phone: "",
    address_line1: "",
    paymentMethod: "cod",
  });

  // Ensure cart is loaded
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const subtotal = getSubtotal();
  const shippingCost = 60;
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      router.push("/products");
    }
  }, [items.length, cartLoading, router]);

  const getItemPrice = (item: (typeof items)[0]) => {
    const price = item.variant?.price || item.product?.price || "0";
    const discountPrice =
      item.variant?.discount_price || item.product?.discount_price || "0";
    return getEffectivePrice(price, discountPrice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - only name and phone are mandatory
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
      // Step 1: Create/update shipping address (only if address provided)
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

      // Step 2: Create order
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
        await clearCart();
        toast.success("Order placed successfully!");

        // For COD, show success message
        if (form.paymentMethod === "cod") {
          toast.success("We'll contact you soon to confirm delivery details");
        }

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
        toast.error(data.error || "Checkout failed");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to process checkout");
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading || items.length === 0) {
    return (
      <div className="site-container py-20 text-center">
        <div className="w-16 h-16 border-4 border-[var(--bg-tertiary)] border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)]">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="site-container py-8 md:py-12 page-enter">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-bg)] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[var(--brand)]" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Secure Checkout</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Complete your purchase safely
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Form Column - Simplified */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Main Contact Info - Minimal */}
            <section className="glass-card-static p-6 md:p-8">
              <h2 className="text-lg font-bold mb-6">Your Information</h2>

              {/* Name - Mandatory */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Full Name <span className="text-[var(--red-500)]">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  placeholder="e.g., Ahmed Hassan"
                  className="input-field w-full"
                />
              </div>

              {/* Phone - Mandatory */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Phone Number <span className="text-[var(--red-500)]">*</span>
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-[var(--text-muted)] px-3 py-2 bg-[var(--bg-secondary)] rounded-l-lg border border-[var(--border)]">
                    +880
                  </span>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="e.g., 1712345678"
                    className="input-field w-full rounded-l-none"
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  We'll use this to contact you about your order
                </p>
              </div>
            </section>

            {/* Optional Details */}
            <section className="glass-card-static p-6 md:p-8">
              <h2 className="text-lg font-bold mb-6">
                Delivery Details{" "}
                <span className="text-xs font-normal text-[var(--text-muted)]">
                  (Optional)
                </span>
              </h2>

              {/* Email - Optional */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="input-field w-full"
                />
              </div>

              {/* Address - Optional */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Delivery Address
                </label>
                <textarea
                  value={form.address_line1}
                  onChange={(e) =>
                    setForm({ ...form, address_line1: e.target.value })
                  }
                  placeholder="House/Apt, Road, Area, etc."
                  className="input-field w-full"
                  rows={2}
                />
                <p className="text-xs text-[var(--text-muted)]">
                  If not provided, we'll call to confirm your delivery location
                </p>
              </div>
            </section>

            {/* Payment Method */}
            <section className="glass-card-static p-6 md:p-8">
              <h2 className="text-lg font-bold mb-6">Payment Method</h2>
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    id: "cod" as const,
                    label: "Cash on Delivery",
                    desc: "Pay when you receive • No advance payment needed",
                    icon: Truck,
                  },
                  {
                    id: "bkash" as const,
                    label: "bKash Payment",
                    desc: "Secure mobile banking • Pay now",
                    icon: CreditCard,
                  },
                  {
                    id: "nagad" as const,
                    label: "Nagad Payment",
                    desc: "Secure mobile banking • Pay now",
                    icon: CreditCard,
                  },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.paymentMethod === method.id
                        ? "border-[var(--brand)] bg-[var(--brand-bg)]"
                        : "border-[var(--border)] hover:border-[var(--brand-light)]"
                    }`}
                  >
                    <div className="flex items-center h-6">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={form.paymentMethod === method.id}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            paymentMethod: e.target.value as
                              | "cod"
                              | "bkash"
                              | "nagad",
                          })
                        }
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <method.icon className="w-4 h-4 text-[var(--accent)]" />
                        <span className="font-semibold text-sm">
                          {method.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {method.desc}
                      </p>
                    </div>
                    {form.paymentMethod === method.id && (
                      <Check className="w-5 h-5 text-[var(--brand)]" />
                    )}
                  </label>
                ))}
              </div>
            </section>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="glass-card-static p-6 sticky top-20">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[var(--accent)]" />
              Order Summary
            </h2>

            {/* Items */}
            <div className="space-y-2 max-h-[280px] overflow-auto mb-5 pr-1">
              {items.map((item) => {
                const ep = getItemPrice(item);
                const img = getCartItemImage(item);
                return (
                  <div
                    key={item.id}
                    className="flex gap-2.5 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]"
                  >
                    <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-secondary)]">
                      <Image
                        src={img}
                        alt={item.product?.name ?? "Product"}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p
                        className="font-medium text-xs leading-snug line-clamp-2"
                        title={item.product?.name}
                      >
                        {item.product?.name}
                      </p>
                      {item.variant?.options &&
                        item.variant.options.length > 0 && (
                          <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                            {item.variant.options
                              .map((o) => o.value_name)
                              .join(" · ")}
                          </p>
                        )}
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          ×{item.quantity}
                        </span>
                        <span className="text-xs font-semibold text-[var(--accent)] tabular-nums">
                          {formatPrice(ep.current * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-3 pt-6 border-t border-[var(--border)] mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">
                  Subtotal ({items.length} items)
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Shipping</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {formatPrice(shippingCost)}
                </span>
              </div>
              <div className="pt-3 border-t border-[var(--border)] flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl text-[var(--accent)]">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] text-right">
                Includes all taxes and duties
              </p>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="w-full btn-primary h-14 text-base relative group justify-center overflow-hidden"
            >
              <span className="relative z-10 font-bold tracking-wide">
                {loading
                  ? "Processing..."
                  : form.paymentMethod === "cod"
                    ? `Place Order • ${formatPrice(total)}`
                    : `Pay ${formatPrice(total)}`}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
              <span>Your information is secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
