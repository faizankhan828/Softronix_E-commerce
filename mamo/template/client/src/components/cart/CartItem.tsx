import { useState, useEffect } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { CartItem as CartItemType } from "../../api/services/cartService";
import { formatCurrency } from "../../lib/utils";
import { useCart } from "../../contexts/CartContext";
import cartService from "../../api/services/cartService";

// Custom Image component to replace next/image
const Image = ({
  src,
  alt,
  fill,
  className,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
}) => (
  <img
    src={src}
    alt={alt}
    className={`${fill ? "w-full h-full object-cover" : ""} ${className || ""}`}
  />
);

// Extended CartItemType with additional properties needed by the component
interface ExtendedCartItem extends CartItemType {
  name?: string;
  image?: string;
  price?: number;
}

interface CartItemProps {
  item: ExtendedCartItem;
  showControls?: boolean;
  isSavedItem?: boolean;
}

export function CartItem({
  item,
  showControls = true,
  isSavedItem = false,
}: CartItemProps) {
  const { updateCartItem, removeFromCart, saveForLater, moveToCartFromSaved } =
    useCart();
  const [quantity, setQuantity] = useState(item.quantity);
  const [inventoryStatus, setInventoryStatus] = useState<{
    available: boolean;
    availableQuantity?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check inventory when component mounts
  useEffect(() => {
    const checkInventory = async () => {
      try {
        const result = await cartService.checkInventory(
          item.productId,
          item.size || "",
          item.color || "",
          item.quantity
        );
        setInventoryStatus(result);
      } catch (error) {
        console.error("Error checking inventory:", error);
      }
    };

    checkInventory();
  }, [item]);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsLoading(true);
    setQuantity(newQuantity);

    if (!isSavedItem) {
      await updateCartItem(item._id, newQuantity, item.size, item.color);
    }

    setIsLoading(false);
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await removeFromCart(item._id);
      // No need to manually update the UI, the CartContext will handle that
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveForLater = async () => {
    setIsLoading(true);
    await saveForLater(item._id);
    setIsLoading(false);
  };

  const handleMoveToCart = async () => {
    setIsLoading(true);
    await moveToCartFromSaved(item._id);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b">
      <div className="relative h-24 w-24 overflow-hidden rounded-md">
        <Image
          src={item.image || "/placeholder.png"}
          alt={item.name || "Product"}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        <div className="text-sm text-muted-foreground mt-1">
          {item.size && <span className="mr-2">Size: {item.size}</span>}
          {item.color && <span>Color: {item.color}</span>}
        </div>
        <div className="mt-1 font-medium">
          {item.price !== undefined ? formatCurrency(item.price) : "$0.00"}
        </div>

        {/* Inventory Status Indicator */}
        {inventoryStatus && !inventoryStatus.available && (
          <div className="flex items-center text-red-500 text-sm mt-1">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span>Out of stock</span>
          </div>
        )}
        {inventoryStatus &&
          inventoryStatus.available &&
          inventoryStatus.availableQuantity &&
          inventoryStatus.availableQuantity < 5 && (
            <div className="flex items-center text-amber-500 text-sm mt-1">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>
                Only {inventoryStatus.availableQuantity} left in stock
              </span>
            </div>
          )}
      </div>

      {showControls && (
        <div className="flex flex-col items-end gap-2">
          {!isSavedItem ? (
            <>
              <div className="flex items-center border rounded-md">
                <button
                  className="px-3 py-1 text-lg"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || isLoading}
                >
                  -
                </button>
                <span className="px-3 py-1">{quantity}</span>
                <button
                  className="px-3 py-1 text-lg"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={
                    isLoading ||
                    (inventoryStatus?.availableQuantity !== undefined &&
                      quantity >= inventoryStatus.availableQuantity)
                  }
                >
                  +
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveForLater}
                  disabled={isLoading}
                >
                  Save for later
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveToCart}
                disabled={isLoading || !inventoryStatus?.available}
              >
                Move to Cart
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
