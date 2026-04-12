import api from "@/lib/api";
import { CartItem, User } from "@/lib/types";
import { getEffectivePrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { create } from "zustand";

// Auth Store
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.success) {
      localStorage.setItem("access_token", data.data.tokens.access_token);
      localStorage.setItem("refresh_token", data.data.tokens.refresh_token);
      set({ user: data.data.user, isAuthenticated: true });
    }
  },

  register: async (email, password, fullName, phone) => {
    const { data } = await api.post("/auth/register", {
      email,
      password,
      full_name: fullName,
      phone,
    });
    if (data.success) {
      localStorage.setItem("access_token", data.data.tokens.access_token);
      localStorage.setItem("refresh_token", data.data.tokens.refresh_token);
      set({ user: data.data.user, isAuthenticated: true });
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await api.get("/auth/me");
      if (data.success) {
        set({ user: data.data, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

// Cart Store
interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get("/cart");
      if (data.success && data.data != null) {
        const raw = data.data as CartItem[] | { items?: CartItem[] };
        const items = Array.isArray(raw) ? raw : (raw.items ?? []);
        set({ items: Array.isArray(items) ? items : [] });
      }
    } catch {
      toast.error("Could not load cart");
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity, variantId) => {
    const payload: Record<string, unknown> = {
      product_id: productId,
      quantity,
    };
    if (variantId) payload.variant_id = variantId;
    await api.post("/cart/items", payload);
    await get().fetchCart();
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      await api.put(`/cart/items/${itemId}`, { quantity });
      await get().fetchCart();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      toast.error(msg || "Could not update quantity");
      await get().fetchCart();
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      await get().fetchCart();
    } catch {
      toast.error("Could not remove item");
      await get().fetchCart();
    }
  },

  clearCart: async () => {
    try {
      await api.delete("/cart");
    } catch {
      /* still clear local state */
    }
    set({ items: [] });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const price = item.variant?.price || item.product?.price || "0";
      const discountPrice =
        item.variant?.discount_price || item.product?.discount_price || "0";
      const ep = getEffectivePrice(price, discountPrice);
      return sum + ep.current * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

// UI Store
interface BuyNowProduct {
  id: string;
  name: string;
  price: string;
  discount_price: string;
  image_url: string;
  quantity: number;
  variantId?: string;
}

interface UIState {
  cartOpen: boolean;
  mobileMenuOpen: boolean;
  searchQuery: string;
  buyNowProduct: BuyNowProduct | null;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  setBuyNowProduct: (product: BuyNowProduct | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  mobileMenuOpen: false,
  searchQuery: "",
  buyNowProduct: null,
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
  setCartOpen: (open) => set({ cartOpen: open }),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setBuyNowProduct: (product) => set({ buyNowProduct: product }),
}));
