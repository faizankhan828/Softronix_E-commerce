import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../components/ui/use-toast";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function Cart() {
  const {
    cart,
    loading,
    error,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    couponCode: contextCouponCode,
    discountAmount,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [couponCode, setCouponCode] = useState(contextCouponCode || "");
  const [discountMessage, setDiscountMessage] = useState("");
  const [discountValid, setDiscountValid] = useState(false);

  // If error occurred while fetching cart
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Handle quantity update
  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    console.log(`Updating cart item ${itemId} to quantity ${quantity}`);

    setIsUpdating(true);
    try {
      await updateCartItem(itemId, quantity);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update item quantity",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: string) => {
    console.log(`Cart.tsx: Removing cart item ${itemId}`);
    setIsUpdating(true);
    try {
      // Call the removeFromCart function from CartContext
      await removeFromCart(itemId);

      // Show success toast
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });

      // No need to manually update the UI, the CartContext will handle that
    } catch (err) {
      console.error("Error removing item from cart:", err);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      console.log("Applying coupon:", couponCode);
      const result = await applyCoupon(couponCode);
      setDiscountMessage(result.message);
      setDiscountValid(result.valid);

      if (result.valid) {
        console.log("Coupon applied successfully:", result);

        // Update the display to show the correct discount type
        if (couponCode.toUpperCase() === "FREESHIP") {
          setDiscountMessage("Free shipping applied!");
        } else if (couponCode.toUpperCase() === "DISCOUNT10") {
          setDiscountMessage("10% discount applied!");
        } else if (couponCode.toUpperCase() === "FLASH25") {
          setDiscountMessage("25% discount applied (max $200)!");
        }

        toast({
          title: "Coupon applied",
          description: result.message,
        });
      } else {
        console.log("Invalid coupon:", result);

        // Check for specific error types
        if (result.alreadyUsed) {
          setDiscountMessage("You've already used this coupon");
          toast({
            title: "Coupon already used",
            description: result.message,
            variant: "destructive",
          });
        } else if (result.limitReached) {
          setDiscountMessage("Coupon usage limit reached");
          toast({
            title: "Coupon limit reached",
            description: result.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invalid coupon",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error("Error applying coupon:", err);
      setDiscountMessage("Error applying coupon");
      setDiscountValid(false);
      toast({
        title: "Error",
        description: "Failed to apply coupon",
        variant: "destructive",
      });
    }
  };

  // Handle proceed to checkout
  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to sign in before checking out",
        variant: "destructive",
      });
      navigate("/auth");
    } else {
      navigate("/checkout");
    }
  };

  // If loading or cart is undefined
  if (loading || !cart) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex items-center justify-center dark:bg-gray-900 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-400">
            Loading your cart...
          </p>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex flex-col items-center justify-center dark:bg-gray-900 dark:text-gray-100">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4 dark:text-gray-400" />
        <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6 dark:text-gray-400">
          Looks like you haven't added any items to your cart yet.
        </p>
        <Button
          asChild
          className="dark:bg-primary dark:text-white dark:hover:bg-primary/80"
        >
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 dark:bg-gray-900 dark:text-gray-100">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Your Cart</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg shadow p-6 dark:bg-gray-800 dark:border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Cart Items ({cart.items.length})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearCart()}
                className="dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Clear Cart
              </Button>
            </div>

            <Separator className="mb-4 dark:bg-gray-700" />

            {cart.items.map((item) => (
              <div
                key={item._id}
                className="flex items-center space-x-4 py-4 border-b last:border-0 dark:border-gray-700"
              >
                <div className="h-24 w-24 relative rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={
                      item.product.images && item.product.images[0]
                        ? item.product.images[0]
                        : "/placeholder-image.png"
                    }
                    alt={item.product.name}
                    className="object-cover h-full w-full"
                    onError={(e) => {
                      // Use a data URI for the fallback image
                      e.currentTarget.src =
                        "data:image/svg+xml;charset=UTF-8,%3Csvg width='150' height='150' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='150' height='150' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' alignment-baseline='middle' font-family='Arial, sans-serif' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.productId}`}
                    className="text-lg font-medium hover:underline"
                  >
                    {item.product.name}
                  </Link>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground dark:text-gray-400">
                    <span>Size: {item.size}</span>
                    <span>Color: {item.color}</span>
                  </div>

                  <div className="flex items-center mt-2">
                    <p className="font-medium">
                      {item.product.discountedPrice ? (
                        <>
                          <span>
                            ${item.product.discountedPrice.toFixed(2)}
                          </span>
                          <span className="ml-2 text-sm line-through text-muted-foreground dark:text-gray-500">
                            ${item.product.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        `$${item.product.price.toFixed(2)}`
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleUpdateQuantity(item._id, item.quantity - 1)
                    }
                    disabled={isUpdating || item.quantity <= 1}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <span className="mx-2 w-8 text-center">{item.quantity}</span>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleUpdateQuantity(item._id, item.quantity + 1)
                    }
                    disabled={isUpdating}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item._id)}
                    disabled={isUpdating}
                    className="ml-2 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="h-4 w-4 text-destructive dark:text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-card rounded-lg shadow p-6 sticky top-24 dark:bg-gray-800 dark:border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-gray-400">
                  Subtotal
                </span>
                <span>${cart?.subtotal?.toFixed(2) || "0.00"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-gray-400">
                  Shipping
                </span>
                <span>${cart?.shippingCost?.toFixed(2) || "0.00"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-gray-400">
                  Tax
                </span>
                <span>${cart?.tax?.toFixed(2) || "0.00"}</span>
              </div>

              <Separator className="dark:bg-gray-700" />

              {/* Coupon Code Input */}
              <div className="mt-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim()}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    Apply
                  </Button>
                </div>
                {discountMessage && (
                  <p
                    className={`text-xs mt-1 ${
                      discountValid
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {discountMessage}
                  </p>
                )}
              </div>

              {/* Only show discount if it's a valid number and greater than 0 */}
              {typeof discountAmount === "number" && discountAmount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount ({couponCode})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${cart?.total?.toFixed(2) || "0.00"}</span>
              </div>

              <Button
                className="w-full mt-4 dark:bg-primary dark:text-white dark:hover:bg-primary/80"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-2 dark:text-gray-400">
                Shipping and taxes calculated at checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
