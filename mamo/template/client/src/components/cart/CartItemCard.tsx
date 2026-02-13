import { useState } from "react";
import { useCart } from "../../contexts/CartContext";
import { Button } from "../ui/button";
import { Trash, Heart, CheckCircle } from "lucide-react";
import { CartItem as CartItemType } from "../../api/services/cartService";
import { Skeleton } from "../ui/skeleton";

interface CartItemCardProps {
  item: CartItemType;
  showControls?: boolean;
}

export function CartItemCard({ item, showControls = true }: CartItemCardProps) {
  const { updateCartItem, removeFromCart, saveForLater, getStockStatus } =
    useCart();
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get stock status
  const stockStatus = getStockStatus(item._id);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;

    setQuantity(newQuantity);

    // Debounce the API call to avoid too many requests
    setIsUpdating(true);
    // Clear any existing timeout
    const timeoutId = setTimeout(async () => {
      try {
        await updateCartItem(item._id, newQuantity);
      } catch (error) {
        console.error("Failed to update quantity:", error);
      } finally {
        setIsUpdating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeFromCart(item._id);
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSaveForLater = async () => {
    setIsSaving(true);
    try {
      await saveForLater(item._id);
    } catch (error) {
      console.error("Failed to save item for later:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getItemPrice = () => {
    const price = item.product.discountedPrice || item.product.price;
    return price * quantity;
  };

  // Render the stock status indicator
  const renderStockStatus = () => {
    if (stockStatus.status === "out_of_stock") {
      return (
        <div className="flex items-center text-destructive gap-1 text-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Currently out of stock</span>
        </div>
      );
    } else if (stockStatus.status === "low_stock") {
      return (
        <div className="flex items-center text-amber-500 gap-1 text-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Only {stockStatus.available} left - order soon!</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-green-600 gap-1 text-xs">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>In stock</span>
        </div>
      );
    }
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
        <img
          src={item.product.images[0]}
          alt={item.product.name}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">{item.product.name}</h3>
          <div className="flex space-x-2 text-sm text-muted-foreground">
            <p>Size: {item.size}</p>
            <span>|</span>
            <p>Color: {item.color}</p>
          </div>
          {renderStockStatus()}
        </div>

        {showControls && (
          <div className="flex flex-wrap items-end justify-between gap-2 mt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || isUpdating}
              >
                -
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={stockStatus.status === "out_of_stock" || isUpdating}
              >
                +
              </Button>
              {isUpdating && (
                <span className="text-xs text-muted-foreground ml-2">
                  Updating...
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveForLater}
                disabled={isSaving}
              >
                <Heart className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={handleRemove}
                disabled={isRemoving}
              >
                <Trash className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end justify-between">
        <p className="font-medium">${getItemPrice().toFixed(2)}</p>
        {item.product.discountedPrice && (
          <p className="text-xs text-muted-foreground line-through">
            ${(item.product.price * quantity).toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

// Skeleton loader version for loading states
export function CartItemCardSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      <Skeleton className="h-24 w-24 flex-shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2 mt-4">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}
