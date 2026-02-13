import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  CreditCard,
  Lock,
  Truck,
  Tag,
  Check,
  Package,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, name: "Shipping", icon: Truck },
  { id: 2, name: "Payment", icon: CreditCard },
  { id: 3, name: "Review", icon: Check },
];

export function Checkout() {
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });
  const [shippingMethod, setShippingMethod] = useState("standard");

  const { cart } = useStore();

  if (cart.items.length === 0) {
    return (
      <MainLayout showFooter={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Add some items to your cart to checkout
            </p>
            <Button asChild>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const shippingCost = shippingMethod === "express" ? 15.99 : shippingMethod === "standard" ? 5.99 : 0;
  const estimatedTotal = cart.total + shippingCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mock order placement
      alert("Order placed successfully! (This is a demo)");
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <Link
            to="/shop"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Continue Shopping
          </Link>

          {/* Progress Steps */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center gap-3",
                      currentStep >= step.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        currentStep >= step.id
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700"
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="font-medium hidden sm:inline">{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-16 sm:w-24 h-1 rounded-full mx-4",
                        currentStep > step.id
                          ? "bg-primary"
                          : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Shipping */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="w-5 h-5" />
                          Shipping Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            placeholder="First Name"
                            value={shippingInfo.firstName}
                            onChange={(e) =>
                              setShippingInfo({ ...shippingInfo, firstName: e.target.value })
                            }
                            required
                          />
                          <Input
                            placeholder="Last Name"
                            value={shippingInfo.lastName}
                            onChange={(e) =>
                              setShippingInfo({ ...shippingInfo, lastName: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={shippingInfo.email}
                            onChange={(e) =>
                              setShippingInfo({ ...shippingInfo, email: e.target.value })
                            }
                            required
                          />
                          <Input
                            type="tel"
                            placeholder="Phone Number"
                            value={shippingInfo.phone}
                            onChange={(e) =>
                              setShippingInfo({ ...shippingInfo, phone: e.target.value })
                            }
                            required
                          />
                        </div>
                        <Input
                          placeholder="Street Address"
                          value={shippingInfo.address}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, address: e.target.value })
                          }
                          required
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <Input
                            placeholder="City"
                            value={shippingInfo.city}
                            onChange={(e) =>
                              setShippingInfo({ ...shippingInfo, city: e.target.value })
                            }
                            required
                          />
                          <Input
                            placeholder="State"
                            value={shippingInfo.state}
                            onChange={(e) =>
                              setShippingInfo({ ...shippingInfo, state: e.target.value })
                            }
                            required
                          />
                          <Input
                            placeholder="ZIP Code"
                            value={shippingInfo.zip}
                            onChange={(e) =>
                              setShippingInfo({ ...shippingInfo, zip: e.target.value })
                            }
                            required
                          />
                          <Input
                            placeholder="Country"
                            value={shippingInfo.country}
                            onChange={(e) =>
                              setShippingInfo({ ...shippingInfo, country: e.target.value })
                            }
                            required
                          />
                        </div>

                        {/* Shipping Method */}
                        <div className="pt-6 border-t">
                          <h3 className="font-semibold mb-4">Shipping Method</h3>
                          <div className="space-y-3">
                            {[
                              { id: "free", name: "Free Shipping", time: "7-10 business days", price: 0 },
                              { id: "standard", name: "Standard", time: "3-5 business days", price: 5.99 },
                              { id: "express", name: "Express", time: "1-2 business days", price: 15.99 },
                            ].map((method) => (
                              <label
                                key={method.id}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors",
                                  shippingMethod === method.id
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                      shippingMethod === method.id
                                        ? "border-primary"
                                        : "border-gray-300"
                                    )}
                                  >
                                    {shippingMethod === method.id && (
                                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{method.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {method.time}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-semibold">
                                  {method.price === 0 ? "Free" : formatCurrency(method.price)}
                                </span>
                                <input
                                  type="radio"
                                  name="shipping"
                                  value={method.id}
                                  checked={shippingMethod === method.id}
                                  onChange={(e) => setShippingMethod(e.target.value)}
                                  className="sr-only"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 2: Payment */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Payment Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm">
                          <Lock className="w-4 h-4" />
                          Your payment information is encrypted and secure
                        </div>
                        <Input
                          placeholder="Card Number"
                          value={paymentInfo.cardNumber}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })
                          }
                          required
                        />
                        <Input
                          placeholder="Cardholder Name"
                          value={paymentInfo.cardName}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, cardName: e.target.value })
                          }
                          required
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="MM/YY"
                            value={paymentInfo.expiry}
                            onChange={(e) =>
                              setPaymentInfo({ ...paymentInfo, expiry: e.target.value })
                            }
                            required
                          />
                          <Input
                            placeholder="CVV"
                            type="password"
                            value={paymentInfo.cvv}
                            onChange={(e) =>
                              setPaymentInfo({ ...paymentInfo, cvv: e.target.value })
                            }
                            required
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Review Your Order</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Shipping Address */}
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Shipping Address
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {shippingInfo.firstName} {shippingInfo.lastName}
                            <br />
                            {shippingInfo.address}
                            <br />
                            {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zip}
                            <br />
                            {shippingInfo.country}
                          </p>
                        </div>

                        {/* Payment Method */}
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Payment Method
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            Card ending in ****{paymentInfo.cardNumber.slice(-4) || "0000"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {cart.items.map((item) => (
                            <div
                              key={item.productId}
                              className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                            >
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">{item.product.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <span className="font-semibold">
                                {formatCurrency(item.product.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-6">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                  )}
                  <Button type="submit" className="flex-1" size="lg">
                    {currentStep === 3 ? "Place Order" : "Continue"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items Preview */}
                  <div className="space-y-3 pb-4 border-b">
                    {cart.items.slice(0, 3).map((item) => (
                      <div key={item.productId} className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">
                            {item.product.name}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {cart.items.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{cart.items.length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(cart.subtotal)}</span>
                    </div>
                    {cart.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Discount ({cart.discountCode})
                        </span>
                        <span>-{formatCurrency(cart.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-4 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(estimatedTotal)}</span>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 pt-4 border-t text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    Secure checkout powered by Stripe
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
