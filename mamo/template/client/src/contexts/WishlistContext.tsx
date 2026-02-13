import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import wishlistService, { WishlistItem } from "../api/services/wishlistService";
import { useAuth } from "./AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface Wishlist {
  items: WishlistItem[];
}

interface WishlistContextType {
  wishlist: Wishlist;
  loading: boolean;
  error: string | null;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

// Mock data for when API is unavailable
// Unused mock data
/*
const mockWishlistItems: WishlistItem[] = [
  {
    _id: "mock1",
    productId: "1",
    product: {
      id: "1",
      name: "Classic White T-Shirt",
      price: 29.99,
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
      ],
    },
  },
];
*/

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData] = useState(false);

  // Create wishlist object
  const wishlist: Wishlist = {
    items: wishlistItems,
  };

  const fetchWishlistItems = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wishlistItems = await wishlistService.getWishlist();
      setWishlistItems(wishlistItems);
    } catch (err) {
      setError("Failed to fetch wishlist items.");
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch wishlist whenever auth state changes
  useEffect(() => {
    fetchWishlistItems();
  }, [fetchWishlistItems]);

  const addToWishlist = async (productId: string) => {
    setLoading(true);
    try {
      if (usingMockData) {
        // Mock implementation
        const newItem: WishlistItem = {
          _id: `mock${Date.now()}`,
          productId,
          product: {
            id: productId,
            name: "Mock Product",
            price: 99.99,
            images: [
              "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
            ],
          },
        };
        setWishlistItems((prev) => [...prev, newItem]);
        toast({
          title: "Added to wishlist",
          description: "Product has been added to your wishlist.",
        });
      } else {
        await wishlistService.addToWishlist(productId);
        // Refresh wishlist
        const items = await wishlistService.getWishlist();
        setWishlistItems(items);
        toast({
          title: "Added to wishlist",
          description: "Product has been added to your wishlist.",
        });
      }
      setError(null);
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
      setError("Failed to add item to wishlist. Please try again.");
      toast({
        title: "Error",
        description: "Failed to add item to wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setLoading(true);
    try {
      if (usingMockData) {
        // Mock implementation
        setWishlistItems((prev) =>
          prev.filter((item) => item.productId !== productId)
        );
        toast({
          title: "Removed from wishlist",
          description: "Product has been removed from your wishlist.",
        });
      } else {
        // First, find the item ID from the productId
        const item = wishlistItems.find((item) => item.productId === productId);

        if (item) {
          await wishlistService.removeFromWishlist(item._id);

          // Refresh wishlist
          try {
            const items = await wishlistService.getWishlist();
            setWishlistItems(items);
            toast({
              title: "Removed from wishlist",
              description: "Product has been removed from your wishlist.",
            });
          } catch (refreshError) {
            console.error("Error refreshing wishlist:", refreshError);
            // Force refresh anyway by removing the item from the local state
            setWishlistItems((prev) =>
              prev.filter((item) => item.productId !== productId)
            );
          }
        } else {
          console.error("Item not found in wishlist:", productId);
          toast({
            title: "Error",
            description: "Item not found in wishlist.",
            variant: "destructive",
          });
        }
      }
      setError(null);
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
      setError("Failed to remove item from wishlist. Please try again.");
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearWishlist = async () => {
    setLoading(true);
    try {
      if (usingMockData) {
        // Mock implementation
        setWishlistItems([]);
        toast({
          title: "Wishlist cleared",
          description: "Your wishlist has been cleared.",
        });
      } else {
        await wishlistService.clearWishlist();
        setWishlistItems([]);
        toast({
          title: "Wishlist cleared",
          description: "Your wishlist has been cleared.",
        });
      }
      setError(null);
    } catch (err) {
      console.error("Failed to clear wishlist:", err);
      setError("Failed to clear wishlist. Please try again.");
      toast({
        title: "Error",
        description: "Failed to clear wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const value = {
    wishlist,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
