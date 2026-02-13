import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { ShoppingBag, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CartAbandonmentAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const { abandonedCartRecovery, cart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const checkForAbandonedCart = async () => {
      // Don't show the alert if we're already on the cart page or if cart is empty
      if (
        window.location.pathname.includes("/cart") ||
        !cart ||
        cart.items.length === 0
      ) {
        return;
      }

      const hasAbandonedCart = await abandonedCartRecovery();
      if (hasAbandonedCart) {
        // Show the alert
        setShowAlert(true);
      }
    };

    // Delay the check to avoid showing the alert immediately on page load
    const timeout = setTimeout(checkForAbandonedCart, 2000);

    return () => clearTimeout(timeout);
  }, [abandonedCartRecovery, cart]);

  const handleViewCart = () => {
    setShowAlert(false);
    navigate("/cart");
  };

  const handleDismiss = () => {
    setShowAlert(false);

    // Update the last activity time to avoid showing the alert again too soon
    localStorage.setItem("cartLastActivity", new Date().toISOString());
  };

  if (!showAlert) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Alert className="shadow-lg bg-white dark:bg-gray-900 border-primary">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <AlertTitle className="text-primary flex items-center gap-2 mb-2">
              <ShoppingBag className="h-4 w-4" />
              Items in your cart
            </AlertTitle>
            <AlertDescription className="text-sm">
              You have {cart?.items.length}{" "}
              {cart?.items.length === 1 ? "item" : "items"} waiting in your
              cart. Continue shopping?
            </AlertDescription>
            <Button
              variant="default"
              className="w-full mt-3"
              onClick={handleViewCart}
            >
              View my cart
            </Button>
          </div>
          <Button
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </Alert>
    </div>
  );
}
