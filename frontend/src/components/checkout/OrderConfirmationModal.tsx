"use client";

import { formatPrice } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Mail, Package, Phone, Truck, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

interface OrderConfirmationModalProps {
  order: {
    id: string;
    order_number: string;
    total: number;
    payment_method: string;
    guest_email?: string;
    guest_phone?: string;
    shipping_address?: {
      full_name: string;
      address_line1: string;
      phone: string;
    };
    items?: Array<{
      id: string;
      product_name: string;
      quantity: number;
      total_price: number;
    }>;
  };
  isOpen: boolean;
  onClose: () => void;
  isGuest: boolean;
}

export default function OrderConfirmationModal({
  order,
  isOpen,
  onClose,
  isGuest,
}: OrderConfirmationModalProps) {
  const [copied, setCopied] = useState(false);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    toast.success("Order ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl z-50 overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl font-bold text-center text-black mb-3">
                Thank You!
              </h2>
              <p className="text-center text-neutral-600 text-lg mb-2 font-semibold">
                Your order is confirmed
              </p>
              <p className="text-center text-neutral-500 mb-8">
                {isGuest
                  ? "We will contact you shortly at the number provided to arrange delivery"
                  : "We will contact you shortly to confirm your delivery details"}
              </p>

              {/* Order Number Section */}
              <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-2xl p-6 mb-8 border-2 border-[#ef4a23]">
                <p className="text-sm text-[#ef4a23] mb-2 font-bold uppercase tracking-widest">
                  {isGuest ? "📌 Save This Order ID" : "Order ID"}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-3xl sm:text-4xl font-black text-black font-mono">
                      {order.order_number}
                    </p>
                  </div>
                  <button
                    onClick={copyOrderNumber}
                    className={`shrink-0 p-3 rounded-lg transition-all ${
                      copied
                        ? "bg-[#ef4a23] text-white"
                        : "bg-white hover:bg-orange-50 text-[#ef4a23]"
                    }`}
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-neutral-600 mt-2">
                  ✓ {copied ? "Copied to clipboard" : "Click to copy"}{" "}
                  {isGuest ? "— Save it for tracking" : ""}
                </p>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Total */}
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-sm text-neutral-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-[#ef4a23]">
                    {formatPrice(order.total)}
                  </p>
                </div>

                {/* Payment Method */}
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-sm text-neutral-600 mb-1">
                    Payment Method
                  </p>
                  <p className="text-lg font-semibold text-black">
                    {order.payment_method === "cod"
                      ? "Cash on Delivery"
                      : order.payment_method.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Items Section */}
              {order.items && order.items.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-black mb-3 uppercase tracking-wide">
                    Items ({order.items.length})
                  </h3>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-semibold text-black">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-black">
                          {formatPrice(item.total_price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-blue-50 rounded-xl p-4 mb-8 border border-blue-200">
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Delivery Details
                </h3>
                <div className="space-y-2 text-sm">
                  {order.shipping_address && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="text-neutral-600 min-w-20">Name:</span>
                        <span className="font-semibold text-black">
                          {order.shipping_address.full_name}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-neutral-600 min-w-20">
                          Address:
                        </span>
                        <span className="font-semibold text-black">
                          {order.shipping_address.address_line1}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-neutral-600 mt-0.5 shrink-0" />
                        <span className="font-semibold text-black">
                          {order.shipping_address.phone}
                        </span>
                      </div>
                    </>
                  )}
                  {isGuest && order.guest_email && (
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                      <span className="font-semibold text-black">
                        {order.guest_email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Important Info */}
              <div className="bg-blue-50 rounded-xl p-4 mb-8 border border-blue-200">
                <p className="text-sm text-blue-900 font-bold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  What Happens Next?
                </p>
                <ul className="text-sm text-blue-900 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">1.</span>
                    <span>
                      <strong>We will call you</strong> at{" "}
                      {order.guest_phone || "your phone"} to confirm delivery
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">2.</span>
                    <span>
                      Your order will be <strong>processed immediately</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">3.</span>
                    <span>
                      We will <strong>prepare and pack</strong> your items with
                      care
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">4.</span>
                    <span>
                      <strong>Track live</strong> using your order ID above
                    </span>
                  </li>
                </ul>
              </div>

              {/* Guest Tracking Info */}
              {isGuest && (
                <div className="bg-green-50 rounded-xl p-4 mb-8 border border-green-200">
                  <p className="text-sm text-green-900 font-bold mb-3">
                    ✓ Track Your Order Anytime
                  </p>
                  <p className="text-sm text-green-800 mb-4">
                    Use your order ID to check status, delivery date, and
                    location — no account needed.
                  </p>
                  <Link
                    href={`/track?order=${order.order_number}`}
                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    View Tracking →
                  </Link>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-black hover:bg-neutral-900 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Continue Shopping
                </button>
                <Link
                  href={
                    isGuest ? `/track?order=${order.order_number}` : "/orders"
                  }
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-black font-bold py-3 rounded-lg transition-colors text-center flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  {isGuest ? "Track Order" : "View Orders"}
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
