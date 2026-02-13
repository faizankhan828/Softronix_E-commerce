export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  imageUrl: string;
  images?: string[];
  category: string;
  rating: number;
  reviewCount: number;
  currency: string;
  stock: number;
  isNew?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  total: number;
}

export interface ClerkAction {
  type: 
    | "show_products"
    | "filter_products"
    | "sort_products"
    | "add_to_cart"
    | "remove_from_cart"
    | "apply_discount"
    | "navigate"
    | "show_product_cards"
    | "update_price"
    | "clear_filters";
  payload?: any;
}

export interface ClerkMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  products?: Product[];
  action?: ClerkAction;
}

export type SortOption = "relevance" | "price-low" | "price-high" | "rating" | "newest";

export interface FilterState {
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  search?: string;
  sortBy: SortOption;
}
