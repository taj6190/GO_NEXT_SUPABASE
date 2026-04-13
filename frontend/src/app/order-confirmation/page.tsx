/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import OrderConfirmationModal from "@/components/checkout/OrderConfirmationModal"; // Adjust this import path if needed
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// 1. The component that actually uses useSearchParams
function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order");

  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null); // Replace 'any' with your actual Order type if exported

  useEffect(() => {
    if (!orderId) {
      // If there's no order ID in the URL, you might want to redirect them
      router.push("/");
      return;
    }

    // TODO: Replace this with your actual API fetch logic
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        // Example: const response = await fetch(`/api/orders/${orderId}`);
        // const data = await response.json();

        // Mock data to match your Modal's expected props
        const mockData = {
          id: "1",
          order_number: orderId,
          total: 150.0,
          payment_method: "credit_card",
          items: [
            {
              id: "item_1",
              product_name: "Example Product",
              quantity: 1,
              total_price: 150.0,
            },
          ],
        };

        setOrderData(mockData);
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const handleClose = () => {
    setIsOpen(false);
    // Optional: Redirect to home or another page when modal closes
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Order not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrderConfirmationModal
        order={orderData}
        isOpen={isOpen}
        onClose={handleClose}
        isGuest={false} // Update this based on your auth logic
      />
    </div>
  );
}

// 2. The default export wrapped in a Suspense boundary
export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Loading page...</p>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
