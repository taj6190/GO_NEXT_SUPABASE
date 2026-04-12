"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CreditCard, ShoppingBag, Truck, Check, ShieldCheck } from "lucide-react";
import { useCartStore, useAuthStore } from "@/store";
import { formatPrice, getCartItemImage, getEffectivePrice } from "@/lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface CheckoutForm {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  city: string;
  district: string;
  postal_code: string;
  paymentMethod: "cod" | "bkash" | "nagad";
  notes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, isLoading: cartLoading, clearCart, fetchCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    full_name: "",
    email: "",
    phone: "",
    address_line1: "",
    city: "Dhaka",
    district: "Dhaka",
    postal_code: "",
    paymentMethod: "cod",
    notes: "",
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

  const getItemPrice = (item: typeof items[0]) => {
    const price = item.variant?.price || item.product?.price || "0";
    const discountPrice = item.variant?.discount_price || item.product?.discount_price || "0";
    return getEffectivePrice(price, discountPrice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create shipping address
      const { data: addrData } = await api.post("/addresses", {
        full_name: form.full_name,
        phone: form.phone,
        address_line1: form.address_line1,
        city: form.city,
        district: form.district,
        postal_code: form.postal_code,
        is_default: true,
      });

      if (!addrData.success) {
        toast.error(addrData.error || "Failed to save address");
        setLoading(false);
        return;
      }

      const addressId = addrData.data?.id;

      // Step 2: Create order (backend uses cart items automatically)
      const orderPayload: Record<string, unknown> = {
        shipping_address_id: addressId,
        payment_method: form.paymentMethod,
        notes: form.notes,
      };

      // Add guest info if not authenticated
      if (!isAuthenticated) {
        orderPayload.guest_email = form.email;
        orderPayload.guest_phone = form.phone;
      }

      const { data } = await api.post("/orders", orderPayload);

      if (data.success) {
        await clearCart();
        toast.success("Order placed successfully!");
        const orderNumber = data.data?.order_number;
        router.push(orderNumber ? `/track?order=${orderNumber}` : "/");
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
          <p className="text-sm text-[var(--text-muted)]">Complete your purchase safely</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Form Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Info */}
            <section className="glass-card-static p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">1</span>
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Full Name *</label>
                  <input required type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Email Address *</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Phone Number *</label>
                  <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 1..." className="input-field" />
                </div>
              </div>
            </section>

            {/* Shipping Info */}
            <section className="glass-card-static p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">2</span>
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Street Address *</label>
                  <input required type="text" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} placeholder="House/Apt, Road, Area" className="input-field" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">City/District *</label>
                  <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, district: e.target.value })} className="input-field">
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Other">Other District</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Postal Code</label>
                  <input type="text" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} placeholder="1210" className="input-field" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Order Notes (Optional)</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special instructions..." className="input-field" rows={2} />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="glass-card-static p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center">3</span>
                Payment Method
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order", icon: Truck },
                  { id: "bkash", label: "bKash Payment", desc: "Secure mobile banking", icon: CreditCard },
                  { id: "nagad", label: "Nagad Payment", desc: "Secure mobile banking", icon: CreditCard },
                ].map((method) => (
                  <label key={method.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.paymentMethod === method.id ? "border-[var(--brand)] bg-[var(--brand-bg)]" : "border-[var(--border)] hover:border-[var(--brand-light)]"}`}>
                    <div className="flex items-center h-6">
                      <input type="radio" name="paymentMethod" value={method.id} checked={form.paymentMethod === method.id} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as "cod" | "bkash" | "nagad" })} className="w-4 h-4 text-[var(--brand)] border-gray-300 focus:ring-[var(--brand)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <method.icon className="w-4 h-4 text-[var(--accent)]" />
                        <span className="font-semibold">{method.label}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{method.desc}</p>
                    </div>
                    {form.paymentMethod === method.id && <Check className="w-5 h-5 text-[var(--brand)]" />}
                  </label>
                ))}
              </div>
            </section>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="glass-card-static p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[var(--accent)]" />
              Order Summary
            </h2>

            {/* Items */}
            <div className="space-y-2 max-h-[280px] overflow-auto mb-5 pr-1">
              {items.map((item) => {
                const ep = getItemPrice(item);
                const img = getCartItemImage(item);
                return (
                  <div key={item.id} className="flex gap-2.5 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
                    <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-secondary)]">
                      <Image src={img} alt={item.product?.name ?? "Product"} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="font-medium text-xs leading-snug line-clamp-2" title={item.product?.name}>
                        {item.product?.name}
                      </p>
                      {item.variant?.options && item.variant.options.length > 0 && (
                        <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{item.variant.options.map((o) => o.value_name).join(" · ")}</p>
                      )}
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <span className="text-[10px] text-[var(--text-secondary)]">×{item.quantity}</span>
                        <span className="text-xs font-semibold text-[var(--accent)] tabular-nums">{formatPrice(ep.current * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-3 pt-6 border-t border-[var(--border)] mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Subtotal ({items.length} items)</span>
                <span className="font-medium text-[var(--text-primary)]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Shipping</span>
                <span className="font-medium text-[var(--text-primary)]">{formatPrice(shippingCost)}</span>
              </div>
              <div className="pt-3 border-t border-[var(--border)] flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl text-[var(--accent)]">{formatPrice(total)}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] text-right">Includes all taxes and duties</p>
            </div>

            <button type="submit" form="checkout-form" disabled={loading} className="w-full btn-primary h-14 text-base relative group justify-center overflow-hidden">
              <span className="relative z-10 font-bold tracking-wide">
                {loading ? "Processing..." : `Pay ${formatPrice(total)}`}
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
              <span>Payments are secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
