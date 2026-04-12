"use client";

import api from "@/lib/api";
import { Order } from "@/lib/types";
import { formatPrice, getStatusColor } from "@/lib/utils";
import { CheckCircle, Search } from "lucide-react";
import { useState } from "react";

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/orders/track/${orderNumber}`);
      if (data.success) setOrder(data.data);
      else setError("Order not found");
    } catch {
      setError("Order not found. Check the order number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];
  const currentStep = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 page-enter">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-black mb-3">
          📍 Track Your Order
        </h1>
        <p className="text-neutral-600 text-lg">
          Enter your order number to see real-time delivery status
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleTrack} className="mb-10">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. GN-20260413-5001"
            className="input-field flex-1 py-3"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 md:px-8"
          >
            {loading ? "..." : <Search className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-sm text-neutral-500">
          💡 Your order number was sent to your email after purchase
        </p>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 text-center">
          <p className="text-red-700 font-semibold">{error}</p>
          <p className="text-red-600 text-sm mt-1">
            Please check your order number and try again
          </p>
        </div>
      )}

      {/* Order Details */}
      {order && (
        <div className="space-y-6">
          {/* Order Header */}
          <div className="bg-linear-to-br from-neutral-50 to-neutral-100 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-semibold uppercase tracking-wide">
                  Order Number
                </p>
                <p className="text-3xl font-black text-black font-mono mt-1">
                  {order.order_number}
                </p>
              </div>
              <span
                className={`badge text-white font-bold px-4 py-2 rounded-lg ${getStatusColor(order.status)}`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Progress Timeline */}
          {order.status !== "cancelled" && (
            <div className="bg-white rounded-2xl p-6 border border-neutral-200">
              <h2 className="font-bold text-black mb-4">Order Progress</h2>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex items-center flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i <= currentStep
                          ? "bg-[#ef4a23] text-white"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {i <= currentStep ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs ml-1 mr-3 font-semibold capitalize ${
                        i <= currentStep ? "text-[#ef4a23]" : "text-neutral-500"
                      }`}
                    >
                      {step}
                    </span>
                    {i < statusSteps.length - 1 && (
                      <div
                        className={`w-8 h-0.5 ${
                          i < currentStep ? "bg-[#ef4a23]" : "bg-neutral-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600 font-semibold">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-[#ef4a23] mt-1">
                {formatPrice(order.total)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600 font-semibold">
                Payment Method
              </p>
              <p className="text-2xl font-bold text-black mt-1">
                {order.payment?.method?.toUpperCase() || "COD"}
              </p>
            </div>
          </div>

          {/* Order Date */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <p className="text-sm text-neutral-600 font-semibold">Order Date</p>
            <p className="text-lg font-bold text-black mt-1">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-neutral-200">
              <h2 className="font-bold text-black mb-4">
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-black">
                        {item.product_name}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-black">
                      {formatPrice(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
