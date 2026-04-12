"use client";

import api from "@/lib/api";
import { Order } from "@/lib/types";
import { Copy, Package } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("order");
  const email = searchParams.get("email");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setError("No order number provided");
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get(`/orders/track/${orderNumber}`);
        if (data.success) {
          setOrder(data.data);
        } else {
          setError("Unable to load order details. Please try again.");
        }
      } catch {
        setError("Order not found. Please check your order number.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      toast.success("Order ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="site-container py-20 text-center">
        <div className="w-16 h-16 border-4 border-neutral-200 border-t-[#ef4a23] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="site-container py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-black">{error}</h1>
          <p className="text-neutral-600 mb-6">
            Please check your order number and try again, or go back to
            shopping.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/products"
              className="bg-[#ef4a23] hover:bg-[#d63516] text-white font-bold py-2 px-6 rounded-lg"
            >
              Continue Shopping
            </Link>
            <Link
              href="/track"
              className="bg-neutral-200 hover:bg-neutral-300 text-black font-bold py-2 px-6 rounded-lg"
            >
              Track Order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="site-container py-12 md:py-20 flex items-center justify-center min-h-screen">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Thank You Message */}
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">
            Thank You!
          </h1>
          <p className="text-lg text-neutral-600 font-semibold">
            We will contact you shortly at{" "}
            {order.guest_phone || "the number provided"} to arrange delivery
          </p>
        </div>

        {/* Order ID */}
        <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border-2 border-[#ef4a23]">
          <p className="text-sm text-[#ef4a23] font-bold uppercase tracking-widest mb-4">
            Your Order ID
          </p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-5xl md:text-6xl font-black text-black font-mono">
              {order.order_number}
            </p>
            <button
              onClick={copyOrderNumber}
              className={`shrink-0 p-4 rounded-lg transition-all ${
                copied
                  ? "bg-[#ef4a23] text-white"
                  : "bg-white hover:bg-orange-50 text-[#ef4a23]"
              }`}
            >
              <Copy className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-neutral-600 mt-4">
            ✓ {copied ? "Copied!" : "Click to copy"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/products"
            className="bg-black hover:bg-neutral-900 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/track"
            className="bg-neutral-200 hover:bg-neutral-300 text-black font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}
