"use client";

import { useEffect } from "react";
import { useAuthStore, useCartStore } from "@/store";
import CartDrawer from "@/components/cart/CartDrawer";

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
    </>
  );
}
