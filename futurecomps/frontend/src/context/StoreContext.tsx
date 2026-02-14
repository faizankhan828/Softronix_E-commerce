import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type {
  Product,
  CartItem,
  Cart,
  FilterState,
  SortOption,
  ClerkAction,
} from "@/types/store";
import axios from "axios";
import cartService from "@/api/services/cartService";
import wishlistService from "@/api/services/wishlistService";
import type { WishlistItem } from "@/api/services/wishlistService";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface StoreContextType {
  // Products
  products: Product[];
  filteredProducts: Product[];
  featuredProducts: Product[];
  loading: boolean;
  error: string | null;
  filters: FilterState;

  // Cart
  cart: Cart;
  isCartOpen: boolean;
  cartLoading: boolean;

  // Wishlist
  wishlist: WishlistItem[];
  wishlistLoading: boolean;

  // Actions
  fetchProducts: () => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  addToCart: (
    product: Product,
    quantity?: number,
    size?: string,
    color?: string,
  ) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (code: string, percentage: number) => void;
  removeDiscount: () => void;
  setCartOpen: (open: boolean) => void;

  // Wishlist Actions
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;

  // Clerk Actions
  handleClerkAction: (action: ClerkAction) => void;

  // Price manipulation (for haggle mode)
  updateProductPrice: (productId: string, newPrice: number) => void;
}

const defaultCart: Cart = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
};

const defaultFilters: FilterState = {
  sortBy: "relevance",
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters);
  const [cart, setCart] = useState<Cart>(defaultCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  // Calculate cart totals helper
  const calculateCartTotals = useCallback(
    (items: CartItem[], discountPercent: number = 0) => {
      const subtotal = items.reduce(
        (sum, item) =>
          sum +
          (item.product.discountedPrice ?? item.product.price ?? 0) *
            item.quantity,
        0,
      );
      const safePercent = Number.isFinite(discountPercent)
        ? discountPercent
        : 0;
      const discount = subtotal * (safePercent / 100);
      return {
        items,
        subtotal,
        discount,
        total: subtotal - discount,
      };
    },
    [],
  );

  // Initialize cart and wishlist
  useEffect(() => {
    const initStore = async () => {
      // Wait for auth to verify before deciding to load guest or user cart
      if (authLoading) return;

      setCartLoading(true);
      setWishlistLoading(true);
      try {
        // If authenticated, we might want to sync local cart/wishlist first
        if (isAuthenticated) {
          await Promise.all([
            cartService.syncCartAfterLogin(),
            wishlistService.syncWishlistAfterLogin(),
          ]);
        }

        const [cartItems, wishlistItems] = await Promise.all([
          cartService.getCart(),
          wishlistService.getWishlist(),
        ]);

        // Transform items to ensure they match CartItem interface
        const mappedCartItems: CartItem[] = cartItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          product: item.product,
        })) as unknown as CartItem[];

        setCart((prev) => ({
          ...calculateCartTotals(
            mappedCartItems,
            prev.discount > 0 && prev.subtotal > 0
              ? (prev.discount / prev.subtotal) * 100
              : 0,
          ),
          discountCode: prev.discountCode,
        }));

        setWishlist(wishlistItems);
      } catch (err) {
        console.error("Failed to initialize store", err);
      } finally {
        setCartLoading(false);
        setWishlistLoading(false);
      }
    };

    initStore();
  }, [isAuthenticated, authLoading, calculateCartTotals]);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_URL}/products`);
      console.log("Products API response:", data);

      // Handle both array response and paginated response
      let productsArray = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (
        data &&
        typeof data === "object" &&
        Array.isArray(data.products)
      ) {
        productsArray = data.products;
      } else {
        console.error("Unexpected products response format:", data);
        productsArray = [];
      }

      // Transform backend products to match our Product type
      const transformedProducts: Product[] = productsArray.map((p: any) => ({
        _id: p._id,
        name: p.name,
        description: p.description || "",
        price: p.price,
        originalPrice: p.originalPrice || p.price,
        discountedPrice: p.discountedPrice,
        imageUrl:
          p.imageUrl ||
          p.images?.[0] ||
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        images: p.images || [p.imageUrl],
        category: p.category || "General",
        rating: p.rating || 4.5,
        reviewCount: p.reviewCount || Math.floor(Math.random() * 200) + 10,
        currency: p.currency || "USD",
        stock: p.stock || p.inventory || 100,
        isNew: p.isNew || false,
        isFeatured: p.isFeatured || false,
        tags: p.tags || [],
        colors: p.colors || [],
        sizes: p.sizes || [],
      }));
      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products");
      // Set empty array instead of demo products
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...products];

    // Category filter
    if (filters.category) {
      result = result.filter((p) =>
        p.category.toLowerCase().includes(filters.category!.toLowerCase()),
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower),
      );
    }

    // Price range filter
    if (filters.priceRange) {
      result = result.filter(
        (p) =>
          p.price >= filters.priceRange![0] &&
          p.price <= filters.priceRange![1],
      );
    }

    // Rating filter
    if (filters.rating) {
      result = result.filter((p) => p.rating >= filters.rating!);
    }

    // Sorting
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
    }

    setFilteredProducts(result);
  }, [products, filters]);

  // Cart actions
  const addToCart = useCallback(
    async (product: Product, quantity = 1, size?: string, color?: string) => {
      try {
        // Optimistic update
        setCart((prev) => {
          const existingIndex = prev.items.findIndex(
            (item) =>
              item.productId === product._id &&
              item.size === size &&
              item.color === color,
          );

          let newItems: CartItem[];
          if (existingIndex > -1) {
            newItems = [...prev.items];
            newItems[existingIndex].quantity += quantity;
          } else {
            newItems = [
              ...prev.items,
              { productId: product._id, product, quantity, size, color },
            ];
          }

          const discountPercent =
            prev.discountCode && prev.subtotal > 0
              ? (prev.discount / prev.subtotal) * 100
              : 0;
          return {
            ...calculateCartTotals(newItems, discountPercent),
            discountCode: prev.discountCode,
          };
        });

        setIsCartOpen(true);

        // Sync with service
        await cartService.addToCart(
          product._id,
          quantity,
          size || "",
          color || "",
        );
      } catch (err) {
        console.error("Failed to add to cart", err);
        // revert logic could go here
      }
    },
    [calculateCartTotals],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      try {
        // Optimistic update
        setCart((prev) => {
          const newItems = prev.items.filter(
            (item) => item.productId !== productId,
          );
          const discountPercent =
            prev.discountCode && prev.subtotal > 0
              ? (prev.discount / prev.subtotal) * 100
              : 0;
          return {
            ...calculateCartTotals(newItems, discountPercent),
            discountCode: prev.discountCode,
          };
        });

        await cartService.removeFromCart(productId);
      } catch (err) {
        console.error("Failed to remove from cart", err);
      }
    },
    [calculateCartTotals],
  );

  const updateCartQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(productId);
        return;
      }
      try {
        // Optimistic update
        setCart((prev) => {
          const newItems = prev.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item,
          );
          const discountPercent =
            prev.discountCode && prev.subtotal > 0
              ? (prev.discount / prev.subtotal) * 100
              : 0;
          return {
            ...calculateCartTotals(newItems, discountPercent),
            discountCode: prev.discountCode,
          };
        });

        // Sync
        await cartService.updateCartItem(productId, quantity);
      } catch (err) {
        console.error("Failed to update cart quantity", err);
      }
    },
    [calculateCartTotals, removeFromCart],
  );

  const clearCart = useCallback(async () => {
    try {
      setCart(defaultCart);
      await cartService.clearCart();
    } catch (err) {
      console.error("Failed to clear cart", err);
    }
  }, []);

  const applyDiscount = useCallback(
    (code: string, percentage: number) => {
      setCart((prev) => ({
        ...calculateCartTotals(prev.items, percentage),
        discountCode: code,
      }));
    },
    [calculateCartTotals],
  );

  const removeDiscount = useCallback(() => {
    setCart((prev) => ({
      ...calculateCartTotals(prev.items, 0),
      discountCode: undefined,
    }));
  }, [calculateCartTotals]);

  // Wishlist Actions
  const addToWishlist = useCallback(async (productId: string) => {
    try {
      // Optimistic update: we need the product details to add it nicely
      // But for now, just sync with backend and refresh wishlist
      await wishlistService.addToWishlist(productId);
      const updatedWishlist = await wishlistService.getWishlist();
      setWishlist(updatedWishlist);
    } catch (err) {
      console.error("Failed to add to wishlist", err);
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId: string) => {
    try {
      // Optimistic
      setWishlist((prev) =>
        prev.filter((item) => item.productId !== productId),
      );
      await wishlistService.removeFromWishlist(productId);
    } catch (err) {
      console.error("Failed to remove from wishlist", err);
    }
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.some((item) => item.productId === productId);
    },
    [wishlist],
  );

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const setCartOpen = useCallback((open: boolean) => {
    setIsCartOpen(open);
  }, []);

  // Update product price (for haggle mode)
  const updateProductPrice = useCallback(
    (productId: string, newPrice: number) => {
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, discountedPrice: newPrice, originalPrice: p.price }
            : p,
        ),
      );
      // Also update in cart (set discountedPrice so cart uses it)
      setCart((prev) => {
        const newItems = prev.items.map((item) =>
          item.productId === productId
            ? {
                ...item,
                product: {
                  ...item.product,
                  discountedPrice: newPrice,
                  originalPrice: item.product.price,
                },
              }
            : item,
        );
        const discountPercent =
          prev.discountCode && prev.subtotal > 0
            ? (prev.discount / prev.subtotal) * 100
            : 0;
        return {
          ...calculateCartTotals(newItems, discountPercent),
          discountCode: prev.discountCode,
        };
      });
    },
    [],
  );

  // Handle clerk actions
  const handleClerkAction = useCallback(
    (action: ClerkAction) => {
      switch (action.type) {
        case "show_products":
          clearFilters();
          break;
        case "filter_products":
          setFilters({
            category: action.payload?.category,
            search: action.payload?.search,
            priceRange: action.payload?.priceRange,
          });
          break;
        case "sort_products":
          setFilters({ sortBy: action.payload?.sortBy as SortOption });
          break;
        case "add_to_cart":
          if (action.payload?.product) {
            addToCart(action.payload.product, action.payload.quantity || 1);
          } else if (action.payload?.productId) {
            // Find product by ID from current products list
            const product = products.find(
              (p) => p._id === action.payload.productId,
            );
            if (product) {
              addToCart(
                product,
                action.payload.quantity || 1,
                action.payload?.size,
                action.payload?.color,
              );
            }
          }
          break;
        case "remove_from_cart":
          if (action.payload?.productId) {
            removeFromCart(action.payload.productId);
          }
          break;
        case "apply_discount":
        case "apply_coupon":
          if (action.payload?.code && action.payload?.percentage) {
            applyDiscount(action.payload.code, action.payload.percentage);
          }
          break;
        case "update_price":
          if (action.payload?.productId && action.payload?.newPrice) {
            updateProductPrice(
              action.payload.productId,
              action.payload.newPrice,
            );
          }
          break;
        case "check_inventory":
          // Inventory checks are handled in AiClerk via backend API
          // This is a no-op on store side
          break;
        case "trigger_checkout":
          // Navigation is handled by the calling component (AiClerk/CartDrawer)
          // StoreContext just opens cart if empty so user can see it
          if (cart.items.length === 0) {
            setIsCartOpen(true);
          }
          break;
        case "clear_filters":
          clearFilters();
          break;
      }
    },
    [
      products,
      cart.items.length,
      addToCart,
      removeFromCart,
      applyDiscount,
      setFilters,
      clearFilters,
      updateProductPrice,
    ],
  );

  // Get featured products
  const featuredProducts = products
    .filter((p) => p.isFeatured || p.isNew)
    .slice(0, 8);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <StoreContext.Provider
      value={{
        products,
        filteredProducts,
        featuredProducts,
        loading,
        error,
        filters,
        cart,
        isCartOpen,
        cartLoading,
        wishlist,
        wishlistLoading,
        fetchProducts,
        setFilters,
        clearFilters,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        applyDiscount,
        removeDiscount,
        setCartOpen,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        handleClerkAction,
        updateProductPrice,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
