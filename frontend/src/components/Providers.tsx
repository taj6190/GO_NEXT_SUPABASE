"use client";

import CartDrawer from "@/components/cart/CartDrawer";
import BuyNowModal from "@/components/checkout/BuyNowModal";
import { useAuthStore, useCartStore } from "@/store";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const loadUser = useAuthStore((s) => s.loadUser);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    loadUser();
    fetchCart();
  }, [loadUser, fetchCart]);

  return (
    <>
      {children}
      <CartDrawer />
      <BuyNowModal />
    </>
  );
}
