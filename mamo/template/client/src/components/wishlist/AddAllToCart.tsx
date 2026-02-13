import { useState } from "react";
import { useWishlist } from "../../contexts/WishlistContext";
import { useCart } from "../../contexts/CartContext";
import { Button } from "../ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export function AddAllToCart() {
  const { wishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAddAllToCart = async () => {
    if (!wishlist?.items.length) {
      toast.info("Your wishlist is empty");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    let successCount = 0;
    let errorCount = 0;

    try {
      const totalItems = wishlist.items.length;

      // Add each item to cart sequentially
      for (let i = 0; i < totalItems; i++) {
        const item = wishlist.items[i];

        try {
          // Use default size/color for simplicity - in a real app, you'd prompt the user to select these
          await addToCart(item.productId, 1, "M", "Default");
          successCount++;
        } catch (error) {
          console.error(`Error adding item ${item.productId} to cart:`, error);
          errorCount++;
        }

        // Update progress
        setProgress(Math.round(((i + 1) / totalItems) * 100));
      }

      // Clear wishlist if at least one item was successfully added
      if (successCount > 0) {
        await clearWishlist();
      }

      // Show appropriate message
      if (successCount === totalItems) {
        toast.success("All items successfully added to cart");
      } else if (successCount > 0) {
        toast.warning(`Added ${successCount} of ${totalItems} items to cart`);
      } else {
        toast.error("Failed to add items to cart");
      }
    } catch (error) {
      console.error("Error adding all items to cart:", error);
      toast.error("Failed to add items to cart");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="mb-4">
      <Button
        onClick={handleAddAllToCart}
        disabled={isLoading || !wishlist?.items.length}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress > 0 ? `Adding... ${progress}%` : "Adding to cart..."}
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add All to Cart
          </>
        )}
      </Button>
    </div>
  );
}
