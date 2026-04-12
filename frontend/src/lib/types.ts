// API Types for GoNext eCommerce

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface OptionValue {
  id: string;
  option_group_id: string;
  value: string;
  color_hex?: string;
  sort_order: number;
}

export interface OptionGroup {
  id: string;
  product_id: string;
  name: string;
  sort_order: number;
  values: OptionValue[];
  created_at: string;
}

export interface VariantOption {
  id: string;
  variant_id: string;
  option_group_id: string;
  option_value_id: string;
  group_name: string;
  value_name: string;
}

export interface VariantImage {
  id: string;
  variant_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Variant {
  id: string;
  product_id: string;
  sku: string;
  price: string;
  discount_price: string;
  stock_quantity: number;
  weight: string;
  is_active: boolean;
  sort_order: number;
  options: VariantOption[];
  images: VariantImage[];
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  discount_price: string;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
  is_featured: boolean;
  weight: string;
  attributes: Record<string, unknown>;
  average_rating: number;
  review_count: number;
  images: ProductImage[];
  variants?: Variant[];
  option_groups?: OptionGroup[];
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string | null;
  session_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product: Product;
  variant?: Variant;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  items: CartItem[];
  total: string;
}

export interface Address {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  district: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  image_url: string;
  unit_price: string;
  quantity: number;
  total_price: string;
  variant_id?: string;
  variant_options?: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: "cod" | "bkash" | "nagad";
  status: "pending" | "completed" | "failed" | "refunded";
  amount: string;
  transaction_id: string;
  paid_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  guest_email: string;
  guest_phone: string;
  order_number: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: string;
  discount_amount: string;
  shipping_cost: string;
  total: string;
  coupon_id: string | null;
  shipping_address_id: string;
  notes: string;
  items: OrderItem[];
  payment: Payment | null;
  shipping_address: Address | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: string;
  min_order_amount: string;
  max_discount: string;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  product: Product;
  added_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  items: WishlistItem[];
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  distribution: Record<number, number>;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  delivered_orders: number;
  total_revenue: string;
  today_revenue: string;
  revenue_by_day: { date: string; revenue: string; orders: number }[];
  recent_orders: Order[];
  total_products: number;
  low_stock_products: number;
}
