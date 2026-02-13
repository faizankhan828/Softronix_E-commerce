import api from "./api";

export interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  size: string;
  color: string;
  product: {
    id: string;
    name: string;
    price: number;
    discountedPrice?: number | null;
    images: string[];
  };
}

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
        i.color === item.color,
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
    color?: string,
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

  saveForLater: (itemId: string): void => {
    const cartItems = localCart.getItems();
    const savedItems = localCart.getSavedItems();

    const itemIndex = cartItems.findIndex((i) => i._id === itemId);

    if (itemIndex > -1) {
      const item = cartItems[itemIndex];
      savedItems.push(item);
      cartItems.splice(itemIndex, 1);

      localCart.setItems(cartItems);
      localCart.setSavedItems(savedItems);
    }
  },

  moveToCart: (itemId: string): void => {
    const cartItems = localCart.getItems();
    const savedItems = localCart.getSavedItems();

    const itemIndex = savedItems.findIndex((i) => i._id === itemId);

    if (itemIndex > -1) {
      const item = savedItems[itemIndex];
      cartItems.push(item);
      savedItems.splice(itemIndex, 1);

      localCart.setItems(cartItems);
      localCart.setSavedItems(savedItems);
    }
  },
};

// Get cart
const getCart = async (): Promise<CartItem[]> => {
  try {
    // Try to get cart from API regardless of authentication status
    // The server will handle both authenticated and unauthenticated users
    const response = await api.get("/cart");

    // If we got data from the server and it's an array, use it
    if (
      response.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      return response.data;
    }

    // Otherwise, fall back to local storage
    return localCart.getItems();
  } catch (error) {
    // On any error, fall back to local storage
    return localCart.getItems();
  }
};

// Get saved items
const getSavedItems = async (): Promise<CartItem[]> => {
  try {
    // Always return saved items from local storage
    // This is a simplified approach since the server doesn't have a dedicated saved items endpoint
    return localCart.getSavedItems();
  } catch (error) {
    return [];
  }
};

// Check inventory availability
const checkInventory = async (
  productId: string,
  size: string,
  color: string,
  quantity: number,
): Promise<{ available: boolean; availableQuantity?: number }> => {
  try {
    // First try to get the product details to check if it exists
    try {
      const productResponse = await api.get(`/products/${productId}`);
      const product = productResponse.data;

      // Basic inventory check from product data
      if (!product.inStock) {
        //@ts-ignore
        return { available: false, message: "Product is out of stock" };
      }

      // Check size availability
      if (!product.sizes.includes(size)) {
        //@ts-ignore

        return { available: false, message: "Selected size is not available" };
      }

      // Check color availability
      if (!product.colors.includes(color)) {
        //@ts-ignore
        return { available: false, message: "Selected color is not available" };
      }

      // Check quantity
      if (product.inventory !== undefined && product.inventory < quantity) {
        return {
          available: true,
          availableQuantity: product.inventory,
          //@ts-ignore
          message: `Only ${product.inventory} units available`,
        };
      }

      // All checks passed
      return {
        available: true,
        availableQuantity: product.inventory,
        //@ts-ignore
        message: "Product is available",
      };
    } catch (productError) {
      // If product fetch fails, try the inventory endpoint
      const response = await api.get(`/products/${productId}/inventory`, {
        params: { size, color, quantity },
      });
      return response.data;
    }
  } catch (error) {
    // Default to allowing the action if inventory check fails
    return { available: true };
  }
};

// Save item for later
const saveForLater = async (itemId: string): Promise<void> => {
  const token = localStorage.getItem("token");

  if (token) {
    try {
      // User is authenticated, save for later via API
      await api.post(`/cart/save-for-later/${itemId}`);
    } catch (error) {
      throw error;
    }
  } else {
    // User is not authenticated, save for later in local storage
    localCart.saveForLater(itemId);
  }
};

// Move item from saved to cart
const moveToCartFromSaved = async (
  itemId: string,
  quantity: number,
): Promise<void> => {
  const token = localStorage.getItem("token");

  if (token) {
    try {
      // User is authenticated, move to cart via API
      await api.post(`/cart/move-to-cart/${itemId}`, { quantity });
    } catch (error) {
      throw error;
    }
  } else {
    // User is not authenticated, move to cart in local storage
    localCart.moveToCart(itemId);
  }
};

// Add item to cart
const addToCart = async (
  productId: string,
  quantity: number,
  size: string,
  color: string,
): Promise<void> => {
  try {
    // Always try to add to server first
    await api.post("/cart", { productId, quantity, size, color });

    // Also add to local storage as a backup
    try {
      // Get product details
      const productResponse = await api.get(`/products/${productId}`);
      const product = productResponse.data;

      // Create CartItem
      const cartItem: CartItem = {
        _id: `local_${Date.now()}`,
        productId,
        quantity,
        size,
        color,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          discountedPrice: product.discountedPrice,
          images: product.images,
        },
      };

      localCart.addItem(cartItem);
    } catch (productError) {
      // Continue even if local storage fails
    }
  } catch (error) {
    // If server request fails, try to add to local storage only
    try {
      // Get product details
      const productResponse = await api.get(`/products/${productId}`);
      const product = productResponse.data;

      // Create CartItem
      const cartItem: CartItem = {
        _id: `local_${Date.now()}`,
        productId,
        quantity,
        size,
        color,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          discountedPrice: product.discountedPrice,
          images: product.images,
        },
      };

      localCart.addItem(cartItem);
    } catch (localError) {
      throw localError; // Re-throw if both server and local storage fail
    }
  }
};

// Update cart item
const updateCartItem = async (
  itemId: string,
  quantity: number,
  size?: string,
  color?: string,
): Promise<void> => {
  try {
    // Always try to update on server first
    await api.put(`/cart/${itemId}`, { quantity, size, color });

    // Also update in local storage as a backup
    localCart.updateItem(itemId, quantity, size, color);
  } catch (error) {
    // If server update fails, at least update local storage
    localCart.updateItem(itemId, quantity, size, color);
  }
};

// Remove from cart
const removeFromCart = async (itemId: string): Promise<void> => {
  try {
    // Always try to remove from server first
    await api.delete(`/cart/${itemId}`);

    // Also remove from local storage as a backup
    localCart.removeItem(itemId);
  } catch (error) {
    // If server removal fails, at least remove from local storage
    localCart.removeItem(itemId);

    // Re-throw the error to be handled by the caller
    throw error;
  }
};

// Clear cart
const clearCart = async (): Promise<void> => {
  try {
    // Always try to clear on server first
    await api.delete("/cart");

    // Also clear local storage as a backup
    localCart.clearCart();
  } catch (error) {
    // If server clear fails, at least clear local storage
    localCart.clearCart();
  }
};

// Sync local cart with server after login
const syncCartAfterLogin = async (): Promise<CartItem[]> => {
  try {
    const localItems = localCart.getItems();

    if (localItems.length > 0) {
      // Send local items to server
      await api.post("/cart/sync", { items: localItems });
    }

    // Get updated cart from server
    const response = await api.get("/cart");
    const serverItems = response.data;

    // Only clear local cart AFTER confirming server has items
    if (Array.isArray(serverItems) && serverItems.length > 0) {
      localCart.clearCart();
    }

    return serverItems;
  } catch (error) {
    // Don't clear local cart on error — keep it as fallback
    return localCart.getItems();
  }
};

export default {
  getCart,
  getSavedItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCartAfterLogin,
  checkInventory,
  saveForLater,
  moveToCartFromSaved,
};
