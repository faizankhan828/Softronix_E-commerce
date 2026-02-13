import api from "./api";

export interface WishlistItem {
  _id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    discountedPrice?: number | null;
    images: string[];
  };
}

const WISHLIST_STORAGE_KEY = "wishlist_items";

// Helper functions for local wishlist management
const localWishlist = {
  getItems: (): WishlistItem[] => {
    const items = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
  },

  setItems: (items: WishlistItem[]): void => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  },

  addItem: (item: WishlistItem): void => {
    const items = localWishlist.getItems();
    const existingItem = items.find((i) => i.productId === item.productId);

    if (!existingItem) {
      items.push(item);
      localWishlist.setItems(items);
    }
  },

  removeItem: (productId: string): void => {
    const items = localWishlist.getItems();
    const filteredItems = items.filter((i) => i.productId !== productId);
    localWishlist.setItems(filteredItems);
  },

  clearWishlist: (): void => {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
  },

  isInWishlist: (productId: string): boolean => {
    const items = localWishlist.getItems();
    return items.some((i) => i.productId === productId);
  },
};

// Get wishlist items
const getWishlist = async (): Promise<WishlistItem[]> => {
  try {
    // Try to get wishlist from API regardless of authentication status
    // The server will handle both authenticated and unauthenticated users
    const response = await api.get("/wishlist");

    // If we got data from the server and it's an array, use it
    if (
      response.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      return response.data;
    }

    // Otherwise, fall back to local storage
    return localWishlist.getItems();
  } catch (error) {
    console.error("Error fetching wishlist items:", error);
    // On any error, fall back to local storage
    return localWishlist.getItems();
  }
};

// Add product to wishlist
const addToWishlist = async (productId: string): Promise<void> => {
  try {
    // Always try to add to server first
    await api.post("/wishlist", { productId });

    // Also add to local storage as a backup
    try {
      // Get product details
      const productResponse = await api.get(`/products/${productId}`);
      const product = productResponse.data;

      // Create wishlist item
      const wishlistItem: WishlistItem = {
        _id: `local_${Date.now()}`,
        productId,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          discountedPrice: product.discountedPrice,
          images: product.images,
        },
      };

      // Add to local wishlist
      localWishlist.addItem(wishlistItem);
    } catch (productError) {
      console.error("Error adding to local wishlist:", productError);
      // Continue even if local storage fails
    }
  } catch (error) {
    console.error("Error adding to wishlist on server:", error);

    // If server request fails, try to add to local storage only
    try {
      // Get product details
      const productResponse = await api.get(`/products/${productId}`);
      const product = productResponse.data;

      // Create wishlist item
      const wishlistItem: WishlistItem = {
        _id: `local_${Date.now()}`,
        productId,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          discountedPrice: product.discountedPrice,
          images: product.images,
        },
      };

      // Add to local wishlist
      localWishlist.addItem(wishlistItem);
    } catch (localError) {
      console.error("Error adding to local wishlist:", localError);
      throw localError; // Re-throw if both server and local storage fail
    }
  }
};

// Remove product from wishlist
const removeFromWishlist = async (itemId: string): Promise<void> => {
  try {
    // Always try to remove from server first
    await api.delete(`/wishlist/${itemId}`);

    // Also remove from local storage as a backup
    localWishlist.removeItem(itemId);
  } catch (error) {
    console.error("Error removing from wishlist on server:", error);

    // If server removal fails, at least remove from local storage
    localWishlist.removeItem(itemId);
  }
};

// Clear wishlist
const clearWishlist = async (): Promise<void> => {
  try {
    // Always try to clear on server first
    await api.delete("/wishlist");

    // Also clear local storage as a backup
    localWishlist.clearWishlist();
  } catch (error) {
    console.error("Error clearing wishlist on server:", error);

    // If server clear fails, at least clear local storage
    localWishlist.clearWishlist();
  }
};

// Sync local wishlist with server after login
const syncWishlistAfterLogin = async (): Promise<WishlistItem[]> => {
  try {
    const localItems = localWishlist.getItems();

    if (localItems.length > 0) {
      // Send local items to server
      await api.post("/wishlist/sync", { items: localItems });

      // Clear local wishlist after sync
      localWishlist.clearWishlist();
    }

    // Get updated wishlist from server
    const response = await api.get("/wishlist");
    return response.data;
  } catch (error) {
    console.error("Error syncing wishlist after login:", error);
    return [];
  }
};

export default {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  syncWishlistAfterLogin,
  isInWishlist: localWishlist.isInWishlist,
};
