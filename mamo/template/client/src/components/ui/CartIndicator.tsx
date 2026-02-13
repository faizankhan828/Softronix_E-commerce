import { useEffect, useState } from "react";
import { useCart } from "../../contexts/CartContext";
import { ShoppingBag } from "lucide-react";
import { Badge } from "./badge";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface CartIndicatorProps {
  className?: string;
}

export function CartIndicator({ className }: CartIndicatorProps) {
  const { cart } = useCart();
  const [itemCount, setItemCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Set the count of items in the cart
    const count =
      cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

    // Animate when count changes (but not on initial load)
    if (itemCount !== 0 && count !== itemCount) {
      setIsAnimating(true);
      // Reset animation state after animation completes
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }

    setItemCount(count);
  }, [cart?.items, itemCount]);

  return (
    <Link
      to="/cart"
      className={`relative inline-flex items-center justify-center p-2 ${
        className || ""
      }`}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingBag className="h-6 w-6" />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: isAnimating ? [1, 1.2, 1] : 1,
              opacity: 1,
            }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 min-w-[1.5rem] h-[1.5rem] flex items-center justify-center text-xs p-0"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}
