import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, Tag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setCartOpen,
    updateCartQuantity,
    removeFromCart,
    applyDiscount,
    removeDiscount,
  } = useStore();

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    setCouponError("");
    setIsApplyingCoupon(true);
    const code = couponCode.trim().toUpperCase();

    // Simple coupon validation
    const validCoupons: Record<string, number> = {
      WELCOME10: 10,
      SAVE15: 15,
      VIP20: 20,
      FRIENDLY10: 10,
      FREESHIP: 5,
    };

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (validCoupons[code]) {
      applyDiscount(code, validCoupons[code]);
      setCouponCode("");
    } else {
      setCouponError("Invalid coupon code");
    }
    setIsApplyingCoupon(false);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      console.log("❌ User not logged in, redirecting to login");
      setCartOpen(false);
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (!cart || cart.items.length === 0) {
      console.log("❌ Cart is empty");
      return;
    }

    // Navigate to checkout page (client-side to preserve cart state)
    console.log("✅ Navigating to checkout page");
    setCartOpen(false);
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Shopping Cart
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cart.items.length}{" "}
                    {cart.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                    Start shopping or chat with our AI Clerk for personalized
                    recommendations!
                  </p>
                  <Button
                    onClick={() => setCartOpen(false)}
                    asChild
                    className="w-full max-w-xs"
                  >
                    <Link to="/shop">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="flex gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={
                            item.product.images?.[0] ||
                            item.product.imageUrl ||
                            "/placeholder.svg"
                          }
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                        {item.product.stock < 5 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 py-0.5 rounded-full font-bold">
                            Low
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <Link
                          to={`/product/${item.productId}`}
                          onClick={() => setCartOpen(false)}
                          className="font-semibold text-sm text-gray-900 dark:text-white hover:text-primary transition-colors line-clamp-1 block"
                        >
                          {item.product.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 mb-2">
                          {item.size && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                              {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                              {item.color}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item.productId,
                                  item.quantity - 1,
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center font-semibold text-base">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                )
                              }
                              disabled={
                                !!(
                                  item.product.stock &&
                                  item.quantity >= item.product.stock
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Subtotal
                              </p>
                              <p className="font-bold text-base text-gray-900 dark:text-white">
                                {formatCurrency(
                                  item.product.price * item.quantity,
                                  item.product.currency,
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3 bg-white dark:bg-gray-900">
                {/* Coupon */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Promo Code
                  </label>
                  {cart.discountCode ? (
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                          <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-700 dark:text-green-400">
                            {cart.discountCode}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-500">
                            Discount applied!
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={removeDiscount}
                        className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleApplyCoupon()
                          }
                          placeholder="Enter code"
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || isApplyingCoupon}
                        >
                          {isApplyingCoupon ? "Applying..." : "Apply"}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-500">{couponError}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Try: WELCOME10, SAVE15, VIP20
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(cart.subtotal)}
                    </span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Discount
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        -{formatCurrency(cart.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      FREE
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-gray-200 dark:border-gray-800">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-primary">
                      {formatCurrency(cart.total)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {!isAuthenticated && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                        Sign in to complete your purchase
                      </p>
                    </div>
                  )}
                  <Button
                    className="w-full text-base"
                    size="lg"
                    onClick={handleCheckout}
                  >
                    {isAuthenticated
                      ? "Proceed to Checkout"
                      : "Sign In & Checkout"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-base"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
