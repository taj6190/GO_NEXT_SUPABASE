"use client";

import { formatPrice } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
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

  const copyOrderNumber = async () => {
    try {
      // ✅ SSR safe check
      if (typeof window === "undefined") return;

      await navigator.clipboard.writeText(order.order_number);

      setCopied(true);

      // ✅ safe toast usage
      if (toast) toast.success("Order ID copied!");

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
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
              className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Success */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>

              <h2 className="text-3xl font-bold text-center mb-2">
                Thank You!
              </h2>

              <p className="text-center text-neutral-600 mb-8">
                Your order is confirmed
              </p>

              {/* Order ID */}
              <div className="bg-orange-50 rounded-2xl p-6 mb-8 border border-orange-200">
                <p className="text-sm font-bold text-orange-600 mb-2">
                  Order ID
                </p>

                <div className="flex items-center gap-3">
                  <p className="text-2xl font-mono font-bold flex-1">
                    {order.order_number}
                  </p>

                  <button
                    onClick={copyOrderNumber}
                    className="p-2 bg-white rounded-lg hover:bg-orange-100"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {copied ? "Copied!" : "Click to copy"}
                </p>
              </div>

              {/* Total */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-orange-500">
                    {formatPrice(order.total)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600">Payment</p>
                  <p className="font-semibold">
                    {order.payment_method.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Items */}
              {order.items?.length ? (
                <div className="mb-8">
                  <h3 className="font-bold mb-2">
                    Items ({order.items.length})
                  </h3>

                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>

                        <p className="font-bold">
                          {formatPrice(item.total_price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-black text-white py-3 rounded-lg"
                >
                  Continue Shopping
                </button>

                <Link
                  href={`/track?order=${order.order_number}`}
                  className="flex-1 bg-gray-100 text-center py-3 rounded-lg"
                >
                  Track Order
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
