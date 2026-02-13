import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Product, CartItem, Cart, FilterState, SortOption, ClerkAction } from "@/types/store";
import axios from "axios";

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
  
  // Actions
  fetchProducts: () => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (code: string, percentage: number) => void;
  removeDiscount: () => void;
  setCartOpen: (open: boolean) => void;
  
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
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters);
  const [cart, setCart] = useState<Cart>(defaultCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_URL}/products`);
      // Transform backend products to match our Product type
      const transformedProducts: Product[] = data.map((p: any) => ({
        _id: p._id,
        name: p.name,
        description: p.description || "",
        price: p.price,
        originalPrice: p.originalPrice || p.price,
        discountedPrice: p.discountedPrice,
        imageUrl: p.imageUrl || p.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
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
      // Set demo products for testing UI
      const demoProducts = generateDemoProducts();
      setProducts(demoProducts);
      setFilteredProducts(demoProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate demo products for testing
  const generateDemoProducts = (): Product[] => {
    const categories = ["Electronics", "Clothing", "Home & Garden", "Sports", "Beauty"];
    const demoImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
      "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500",
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500",
      "https://images.unsplash.com/photo-1491553895911-0055uj8f1f8e?w=500",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
    ];
    
    return Array.from({ length: 12 }, (_, i) => ({
      _id: `demo-${i + 1}`,
      name: `Premium Product ${i + 1}`,
      description: `High-quality premium product with excellent features. Perfect for everyday use and special occasions.`,
      price: Math.floor(Math.random() * 200) + 29.99,
      originalPrice: Math.floor(Math.random() * 300) + 49.99,
      imageUrl: demoImages[i % demoImages.length],
      images: [demoImages[i % demoImages.length]],
      category: categories[i % categories.length],
      rating: Number((Math.random() * 2 + 3).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 500) + 10,
      currency: "USD",
      stock: Math.floor(Math.random() * 100) + 10,
      isNew: i < 4,
      isFeatured: i % 3 === 0,
      tags: ["bestseller", "trending"],
      colors: ["Black", "White", "Blue"],
      sizes: ["S", "M", "L", "XL"],
    }));
  };

  // Apply filters and sorting
  useEffect(() => {
    let result = [...products];

    // Category filter
    if (filters.category) {
      result = result.filter((p) =>
        p.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
      );
    }

    // Price range filter
    if (filters.priceRange) {
      result = result.filter(
        (p) => p.price >= filters.priceRange![0] && p.price <= filters.priceRange![1]
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

  // Calculate cart totals
  const calculateCartTotals = useCallback((items: CartItem[], discountPercent: number = 0) => {
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = subtotal * (discountPercent / 100);
    return {
      items,
      subtotal,
      discount,
      total: subtotal - discount,
    };
  }, []);

  // Cart actions
  const addToCart = useCallback((product: Product, quantity = 1, size?: string, color?: string) => {
    setCart((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) => item.productId === product._id && item.size === size && item.color === color
      );

      let newItems: CartItem[];
      if (existingIndex > -1) {
        newItems = [...prev.items];
        newItems[existingIndex].quantity += quantity;
      } else {
        newItems = [...prev.items, { productId: product._id, product, quantity, size, color }];
      }

      const discountPercent = prev.discountCode ? (prev.discount / prev.subtotal) * 100 : 0;
      return { ...calculateCartTotals(newItems, discountPercent), discountCode: prev.discountCode };
    });
    setIsCartOpen(true);
  }, [calculateCartTotals]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const newItems = prev.items.filter((item) => item.productId !== productId);
      const discountPercent = prev.discountCode ? (prev.discount / prev.subtotal) * 100 : 0;
      return { ...calculateCartTotals(newItems, discountPercent), discountCode: prev.discountCode };
    });
  }, [calculateCartTotals]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const newItems = prev.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      const discountPercent = prev.discountCode ? (prev.discount / prev.subtotal) * 100 : 0;
      return { ...calculateCartTotals(newItems, discountPercent), discountCode: prev.discountCode };
    });
  }, [calculateCartTotals, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart(defaultCart);
  }, []);

  const applyDiscount = useCallback((code: string, percentage: number) => {
    setCart((prev) => ({
      ...calculateCartTotals(prev.items, percentage),
      discountCode: code,
    }));
  }, [calculateCartTotals]);

  const removeDiscount = useCallback(() => {
    setCart((prev) => ({
      ...calculateCartTotals(prev.items, 0),
      discountCode: undefined,
    }));
  }, [calculateCartTotals]);

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
  const updateProductPrice = useCallback((productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p._id === productId
          ? { ...p, discountedPrice: newPrice, originalPrice: p.price }
          : p
      )
    );
    // Also update in cart
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId
          ? { ...item, product: { ...item.product, price: newPrice, originalPrice: item.product.price } }
          : item
      ),
    }));
  }, []);

  // Handle clerk actions
  const handleClerkAction = useCallback((action: ClerkAction) => {
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
        }
        break;
      case "remove_from_cart":
        if (action.payload?.productId) {
          removeFromCart(action.payload.productId);
        }
        break;
      case "apply_discount":
        if (action.payload?.code && action.payload?.percentage) {
          applyDiscount(action.payload.code, action.payload.percentage);
        }
        break;
      case "update_price":
        if (action.payload?.productId && action.payload?.newPrice) {
          updateProductPrice(action.payload.productId, action.payload.newPrice);
        }
        break;
      case "clear_filters":
        clearFilters();
        break;
    }
  }, [addToCart, removeFromCart, applyDiscount, setFilters, clearFilters, updateProductPrice]);

  // Get featured products
  const featuredProducts = products.filter((p) => p.isFeatured || p.isNew).slice(0, 8);

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
