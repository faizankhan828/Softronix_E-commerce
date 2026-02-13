import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import cartService, { CartItem } from "../api/services/cartService";
import api from "../api/services/api";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import settingsService from "../api/services/settingsService";

interface Cart {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  savedItems: CartItem[];
  note: string;
}

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (
    productId: string,
    quantity: number,
    size: string,
    color: string
  ) => Promise<void>;
  updateCartItem: (
    itemId: string,
    quantity: number,
    size?: string,
    color?: string
  ) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  saveForLater: (itemId: string) => Promise<void>;
  moveToCartFromSaved: (itemId: string) => Promise<void>;
  getStockStatus: (itemId: string) => {
    status: "in_stock" | "low_stock" | "out_of_stock";
    available: number;
    message: string;
  };
  getRelatedProducts: (productId: string) => Promise<any[]>;
  refreshCart: () => Promise<void>;
  abandonedCartRecovery: () => Promise<boolean>;
  applyCoupon: (code: string) => Promise<{
    valid: boolean;
    discount?: number;
    message: string;
    alreadyUsed?: boolean;
    limitReached?: boolean;
    minPurchaseNotMet?: boolean;
  }>;
  couponCode: string;
  discountAmount: number;
  setCartNote: (note: string) => void;
  note: string;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Local storage keys
const CART_STORAGE_KEY = "cart_items";
const SAVED_ITEMS_STORAGE_KEY = "saved_cart_items";

// Helper function to manage local cart
const localCart = {
  getItems: (): CartItem[] => {
    const items = localStorage.getItem(CART_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  },

  setItems: (items: CartItem[]): void => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  },

  getSavedItems: (): CartItem[] => {
    const items = localStorage.getItem(SAVED_ITEMS_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  },

  setSavedItems: (items: CartItem[]): void => {
    localStorage.setItem(SAVED_ITEMS_STORAGE_KEY, JSON.stringify(items));
  },

  addItem: (item: CartItem): void => {
    const items = localCart.getItems();
    const existingItemIndex = items.findIndex(
      (i) =>
        i.productId === item.productId &&
        i.size === item.size &&
        i.color === item.color
    );

    if (existingItemIndex > -1) {
      items[existingItemIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }

    localCart.setItems(items);
  },

  updateItem: (
    itemId: string,
    quantity: number,
    size?: string,
    color?: string
  ): void => {
    const items = localCart.getItems();
    const itemIndex = items.findIndex((i) => i._id === itemId);

    if (itemIndex > -1) {
      items[itemIndex].quantity = quantity;
      if (size) items[itemIndex].size = size;
      if (color) items[itemIndex].color = color;
      localCart.setItems(items);
    }
  },

  removeItem: (itemId: string): void => {
    const items = localCart.getItems();
    const filteredItems = items.filter((i) => i._id !== itemId);
    localCart.setItems(filteredItems);
  },

  clearCart: (): void => {
    localStorage.removeItem(CART_STORAGE_KEY);
  },
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, _] = useState(false);
  const [itemStockStatus, setItemStockStatus] = useState<
    Record<
      string,
      {
        status: "in_stock" | "low_stock" | "out_of_stock";
        available: number;
      }
    >
  >({});
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [note, setNote] = useState("");
  const [_blank, setLastActivityTime] = useState<Date | null>(null);

  const { isAuthenticated } = useAuth();

  // Use state for tax rate
  const [taxRate, setTaxRate] = useState(7.5); // Default tax rate

  // Fetch tax rate on component mount
  useEffect(() => {
    const fetchTaxRate = async () => {
      try {
        const settings = await settingsService.getStoreSettings();
        setTaxRate(settings.taxRate);
      } catch (error) {
        console.warn("Failed to fetch tax rate, using default");
      }
    };

    fetchTaxRate();
  }, []);

  // Calculate cart totals
  const calculateTotals = useCallback(() => {
    const subtotal = cartItems.reduce((total, item) => {
      const price = item.product.discountedPrice || item.product.price;
      return total + price * item.quantity;
    }, 0);

    // Calculate shipping based on subtotal
    const shippingCost = subtotal > 100 ? 0 : 5.99;

    // Calculate tax using store tax rate
    const taxRateDecimal = taxRate / 100; // Convert percentage to decimal
    const tax = subtotal * taxRateDecimal;

    // Ensure discountAmount is a number to prevent NaN in total calculation
    const safeDiscountAmount =
      typeof discountAmount === "number" ? discountAmount : 0;

    // Apply any discounts from coupons
    const total = Math.max(
      0,
      subtotal + shippingCost + tax - safeDiscountAmount
    );

    // Removed console.log for cart calculation to reduce console noise

    return {
      items: cartItems,
      subtotal,
      shippingCost,
      tax,
      total,
      savedItems,
      note,
    };
  }, [cartItems, savedItems, discountAmount, note, couponCode]);

  // Memoized cart state
  const cart = calculateTotals();

  // Initialize cart data
  useEffect(() => {
    const fetchCartData = async () => {
      setLoading(true);

      try {
        // Get cart items - cartService.getCart() will handle both authenticated and unauthenticated users
        const cartData = await cartService.getCart();
        //@ts-ignore

        setCartItems(cartData);

        // For saved items - getSavedItems will handle both authenticated and unauthenticated users
        const savedData = await cartService.getSavedItems();
        //@ts-ignore

        setSavedItems(savedData);
        setError(null);
        //@ts-ignore

        // Check stock status for all items
        cartData.forEach((item) => {
          updateItemStockStatus(item.productId, item.size, item.color);
        });
      } catch (err) {
        setError("Failed to load cart data. Please try again later.");
        // Set empty arrays to prevent errors
        setCartItems([]);
        setSavedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [isAuthenticated]);

  // Update last activity timestamp when cart is modified
  useEffect(() => {
    if (cartItems.length > 0) {
      setLastActivityTime(new Date());

      // Store cart abandonment timestamp in local storage to track across visits
      localStorage.setItem("cartLastActivity", new Date().toISOString());
    }
  }, [cartItems]);

  // Function to update stock status for a single item
  const updateItemStockStatus = async (
    productId: string,
    size: string,
    color: string
  ) => {
    try {
      const result = await cartService.checkInventory(
        productId,
        size,
        color,
        1 // Just checking availability, not quantity
      );

      // Get available quantity
      const available = result.availableQuantity || 0;

      // Determine stock status
      let status: "in_stock" | "low_stock" | "out_of_stock";
      if (available <= 0) {
        status = "out_of_stock";
      } else if (available <= 5) {
        status = "low_stock";
      } else {
        status = "in_stock";
      }

      // Update state with new status
      setItemStockStatus((prev) => ({
        ...prev,
        [productId + size + color]: { status, available },
      }));
    } catch (error) {
      // Silently handle inventory check errors
    }
  };

  // Get stock status for a specific item
  const getStockStatus = (itemId: string) => {
    const item = cartItems.find((item) => item._id === itemId);
    if (!item) {
      return {
        status: "in_stock" as const,
        available: 0,
        message: "",
      };
    }

    const key = item.productId + item.size + item.color;
    const status = itemStockStatus[key] || {
      status: "in_stock" as const,
      available: 10,
    };

    let message = "";
    if (status.status === "out_of_stock") {
      message = "Currently out of stock";
    } else if (status.status === "low_stock") {
      message = `Only ${status.available} left in stock - order soon!`;
    }

    return {
      ...status,
      message,
    };
  };

  // Update all stock statuses
  const refreshStockStatuses = async () => {
    for (const item of cartItems) {
      await updateItemStockStatus(item.productId, item.size, item.color);
    }
  };

  // Refresh cart data
  const refreshCart = async () => {
    setLoading(true);
    try {
      const items = await cartService.getCart();
      setCartItems(items);

      const saved = await cartService.getSavedItems();
      setSavedItems(saved);

      // Refresh stock statuses
      await refreshStockStatuses();

      // Check if there's a coupon applied and verify if it's still in the cart
      if (couponCode) {
        try {
          // Get the cart from the server to check if coupon is still applied
          const cartResponse = await api.get("/cart/details");
          const cartData = cartResponse.data;

          // If the cart doesn't have a coupon or has a different coupon, reset local coupon state
          if (
            !cartData.appliedCoupon ||
            cartData.appliedCoupon.code !== couponCode
          ) {
            setCouponCode("");
            setDiscountAmount(0);
          } else {
            // Update discount amount from server
            setDiscountAmount(cartData.appliedCoupon.discountAmount || 0);
          }
        } catch (couponErr) {
          // Don't reset coupon on error to avoid disrupting the user experience
        }
      }

      setError(null);
    } catch (err) {
      setError("Failed to refresh cart data.");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (
    productId: string,
    quantity: number,
    size: string,
    color: string
  ) => {
    setLoading(true);
    try {
      // First check inventory availability
      const inventoryCheck = await cartService.checkInventory(
        productId,
        size,
        color,
        quantity
      );

      if (!inventoryCheck.available) {
        toast.warning(`Sorry, this item is out of stock.`);
        throw new Error("Item out of stock");
      }

      // If requested quantity exceeds available inventory
      if (
        inventoryCheck.availableQuantity &&
        inventoryCheck.availableQuantity < quantity
      ) {
        toast.warning(
          `Only ${inventoryCheck.availableQuantity} units available. Adjusting quantity.`
        );
        quantity = inventoryCheck.availableQuantity;
      }

      if (!isAuthenticated) {
        try {
          // Get product details
          const productResponse = await api.get(`/products/${productId}`);
          const product = productResponse.data;

          // Create cart item
          const cartItem: CartItem = {
            _id: `local_${Date.now()}`,
            productId,
            quantity,
            size,
            color,
            product: {
              id: product.id || product._id,
              name: product.name,
              price: product.price,
              discountedPrice: product.discountedPrice,
              images: product.images,
            },
          };

          // Add to local cart
          localCart.addItem(cartItem);

          // Update state
          setCartItems(localCart.getItems());
          toast.success("Item added to cart!");
        } catch (error) {
          throw error;
        }
      } else {
        await cartService.addToCart(productId, quantity, size, color);
        // Refresh cart
        const items = await cartService.getCart();
        setCartItems(items);
        toast.success("Item added to cart!");
      }
      setError(null);

      // Update stock status
      await updateItemStockStatus(productId, size, color);

      // Update last activity time
      setLastActivityTime(new Date());
    } catch (err: any) {
      setError("Failed to add item to cart. Please try again.");
      toast.error(
        err.message || "Failed to add item to cart. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (
    itemId: string,
    quantity: number,
    size?: string,
    color?: string
  ) => {
    setLoading(true);
    try {
      // Find the current item
      const currentItem = cartItems.find((item) => item._id === itemId);
      if (!currentItem) throw new Error("Item not found");

      // Check inventory availability if increasing quantity or changing size/color
      const productId = currentItem.productId;
      const itemSize = size || currentItem.size;
      const itemColor = color || currentItem.color;

      // Only check inventory if increasing quantity or changing attributes
      if (quantity > currentItem.quantity || size || color) {
        const inventoryCheck = await cartService.checkInventory(
          productId,
          itemSize,
          itemColor,
          quantity
        );

        if (!inventoryCheck.available) {
          toast.warning(`Sorry, this item is out of stock.`);
          throw new Error("Item out of stock");
        }

        // If requested quantity exceeds available inventory
        if (
          inventoryCheck.availableQuantity &&
          inventoryCheck.availableQuantity < quantity
        ) {
          toast.warning(
            `Only ${inventoryCheck.availableQuantity} units available. Adjusting quantity.`
          );
          quantity = inventoryCheck.availableQuantity;
        }
      }

      if (!isAuthenticated) {
        // Update in local storage
        localCart.updateItem(itemId, quantity, size, color);
        // Update state
        setCartItems(localCart.getItems());
        toast.success("Cart updated!");
      } else {
        await cartService.updateCartItem(itemId, quantity, size, color);
        // Refresh cart
        const items = await cartService.getCart();
        setCartItems(items);
        toast.success("Cart updated!");
      }
      setError(null);

      // Update stock status
      await updateItemStockStatus(productId, itemSize, itemColor);

      // Update last activity time
      setLastActivityTime(new Date());
    } catch (err: any) {
      setError("Failed to update cart item. Please try again.");
      toast.error(
        err.message || "Failed to update cart item. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        // Remove from local storage
        localCart.removeItem(itemId);
        // Update state with a new array to trigger re-render
        const updatedItems = localCart.getItems();
        setCartItems([...updatedItems]);
        toast.success("Item removed from cart!");
      } else {
        // Remove from server
        await cartService.removeFromCart(itemId);
        // Refresh cart with a new request
        const items = await cartService.getCart();
        // Update state with a new array to trigger re-render
        setCartItems([...items]);
        toast.success("Item removed from cart!");
      }
      setError(null);
    } catch (err) {
      setError("Failed to remove item from cart. Please try again.");
      toast.error("Failed to remove item from cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        // Clear local storage
        localCart.clearCart();
        // Update state
        setCartItems([]);
        toast.success("Cart cleared!");
      } else {
        await cartService.clearCart();
        setCartItems([]);
        toast.success("Cart cleared!");
      }
      setError(null);

      // Clear cart abandonment data
      localStorage.removeItem("cartLastActivity");
      setLastActivityTime(null);

      // Reset coupon information
      setCouponCode("");
      setDiscountAmount(0);
    } catch (err) {
      setError("Failed to clear cart. Please try again.");
      toast.error("Failed to clear cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveForLater = async (itemId: string) => {
    setLoading(true);
    try {
      if (usingMockData) {
        // Find the item
        const item = cartItems.find((item) => item._id === itemId);
        if (!item) throw new Error("Item not found");

        // Add to saved items
        setSavedItems((prev) => [...prev, item]);

        // Remove from cart
        setCartItems((prev) => prev.filter((item) => item._id !== itemId));

        toast.success("Item saved for later!");
      } else {
        await cartService.saveForLater(itemId);
        // Refresh both cart and saved items
        const items = await cartService.getCart();
        setCartItems(items);
        const savedItems = await cartService.getSavedItems();
        setSavedItems(savedItems);
        toast.success("Item saved for later!");
      }
      setError(null);
    } catch (err) {
      setError("Failed to save item for later. Please try again.");
      toast.error("Failed to save item for later. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const moveToCartFromSaved = async (itemId: string) => {
    setLoading(true);
    try {
      if (usingMockData) {
        // Find the item
        const item = savedItems.find((item) => item._id === itemId);
        if (!item) throw new Error("Item not found");

        // Add to cart
        setCartItems((prev) => [...prev, item]);

        // Remove from saved items
        setSavedItems((prev) => prev.filter((item) => item._id !== itemId));

        toast.success("Item moved to cart!");
      } else {
        await cartService.moveToCartFromSaved(itemId, 1); // Default quantity 1
        // Refresh both cart and saved items
        const items = await cartService.getCart();
        setCartItems(items);
        const savedItems = await cartService.getSavedItems();
        setSavedItems(savedItems);
        toast.success("Item moved to cart!");
      }
      setError(null);

      // Update last activity time
      setLastActivityTime(new Date());
    } catch (err) {
      setError("Failed to move item to cart. Please try again.");
      toast.error("Failed to move item to cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to get related/recommended products
  const getRelatedProducts = async (productId: string): Promise<any[]> => {
    try {
      // In a real implementation, this would call an API endpoint
      // For now, return mock data
      productId;
      return [
        {
          id: "rel1",
          name: "Related Product 1",
          price: 49.99,
          image:
            "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&auto=format",
        },
        {
          id: "rel2",
          name: "Related Product 2",
          price: 39.99,
          image:
            "https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=300&auto=format",
        },
        {
          id: "rel3",
          name: "Related Product 3",
          price: 59.99,
          image:
            "https://images.unsplash.com/photo-1618354691229-a3f9ec919f5b?w=300&auto=format",
        },
      ];
    } catch (error) {
      return [];
    }
  };

  // Function to handle coupon codes
  const applyCoupon = async (
    code: string
  ): Promise<{
    valid: boolean;
    discount?: number;
    message: string;
    alreadyUsed?: boolean;
    limitReached?: boolean;
    minPurchaseNotMet?: boolean;
  }> => {
    try {
      // Try to validate through the API first if user is authenticated
      const token = localStorage.getItem("token");

      if (token) {
        try {
          // First validate the coupon
          const validateResponse = await api.post("/coupons/validate", {
            code,
          });

          // If validation is successful, apply the coupon
          if (validateResponse.data.valid) {
            try {
              // Apply the coupon to the cart
              const applyResponse = await api.post("/coupons/apply", { code });

              // Get the discount amount from the response
              const discountValue = applyResponse.data.discountAmount;

              console.log("Coupon applied successfully:", applyResponse.data);
              console.log("Setting discount amount to:", discountValue);

              setCouponCode(code);
              setDiscountAmount(discountValue);

              // Refresh the cart to get updated totals
              await refreshCart();

              return {
                valid: true,
                discount: discountValue,
                message:
                  applyResponse.data.message || "Coupon applied successfully",
              };
            } catch (applyError: any) {
              console.error("Error applying coupon:", applyError);

              // Check for specific error types
              const errorData = applyError.response?.data;
              return {
                valid: false,
                message: errorData?.message || "Error applying coupon",
                alreadyUsed: errorData?.alreadyUsed || false,
                limitReached: errorData?.limitReached || false,
                minPurchaseNotMet: errorData?.minPurchaseNotMet || false,
              };
            }
          } else {
            return {
              valid: false,
              message: validateResponse.data.message || "Invalid coupon code",
            };
          }
        } catch (error: any) {
          // If API error, fall back to local validation
          console.error("API Error validating coupon:", error);

          // Check for specific error types
          const errorData = error.response?.data;
          if (errorData) {
            return {
              valid: false,
              message: errorData.message || "Error validating coupon",
              alreadyUsed: errorData.alreadyUsed || false,
              limitReached: errorData.limitReached || false,
              minPurchaseNotMet: errorData.minPurchaseNotMet || false,
            };
          }
        }
      }

      // For non-authenticated users, we'll try to validate the coupon against the database
      // This is a simplified version that doesn't update usage statistics
      try {
        // Try to validate the coupon without authentication
        const response = await api.get(`/coupons/public/${code.toUpperCase()}`);

        if (response.data && response.data.valid) {
          const couponData = response.data.coupon;
          let discountValue = 0;

          // Calculate discount based on coupon type
          if (couponData.type === "percentage") {
            discountValue = cart.subtotal * (couponData.value / 100);
            if (
              couponData.maxDiscount &&
              discountValue > couponData.maxDiscount
            ) {
              discountValue = couponData.maxDiscount;
            }
          } else if (couponData.type === "fixed") {
            discountValue = couponData.value;
          } else if (couponData.type === "shipping") {
            discountValue = cart.shippingCost;
          }

          setCouponCode(code);
          setDiscountAmount(discountValue);

          return {
            valid: true,
            discount: discountValue,
            message: `Coupon applied: ${couponData.description}`,
          };
        }
      } catch (error) {
        console.error("Error validating public coupon:", error);
      }

      // Fallback for specific hardcoded coupons if all else fails
      if (code.toUpperCase() === "DISCOUNT10") {
        const discount = cart.subtotal * 0.1; // 10% discount
        setCouponCode(code);
        setDiscountAmount(discount);
        return {
          valid: true,
          discount,
          message: "10% discount applied to your order!",
        };
      } else if (code.toUpperCase() === "FREESHIP") {
        setCouponCode(code);
        setDiscountAmount(cart.shippingCost);
        return {
          valid: true,
          discount: cart.shippingCost,
          message: "Free shipping applied to your order!",
        };
      } else if (code.toUpperCase() === "FLASH25") {
        const discount = cart.subtotal * 0.25; // 25% discount
        const maxDiscount = 200; // Maximum discount of $200
        const finalDiscount = Math.min(discount, maxDiscount);
        setCouponCode(code);
        setDiscountAmount(finalDiscount);
        return {
          valid: true,
          discount: finalDiscount,
          message: `25% discount applied (max $${maxDiscount})!`,
        };
      } else {
        return {
          valid: false,
          message: "Invalid coupon code. Please try another code.",
        };
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      return {
        valid: false,
        message: "Error processing coupon. Please try again.",
      };
    }
  };

  // Function to handle abandoned cart recovery
  const abandonedCartRecovery = async (): Promise<boolean> => {
    const lastActivity = localStorage.getItem("cartLastActivity");

    if (!lastActivity) return false;

    const lastActivityDate = new Date(lastActivity);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - lastActivityDate.getTime();

    // If cart was abandoned for more than 1 hour (3,600,000 ms)
    if (timeDifference > 3600000 && cartItems.length > 0) {
      // In a real implementation, you'd send an email or notification here
      return true;
    }

    return false;
  };

  // Function to set cart note
  const setCartNote = (newNote: string) => {
    setNote(newNote);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        saveForLater,
        moveToCartFromSaved,
        getStockStatus,
        getRelatedProducts,
        refreshCart,
        abandonedCartRecovery,
        applyCoupon,
        couponCode,
        discountAmount,
        setCartNote,
        note,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
