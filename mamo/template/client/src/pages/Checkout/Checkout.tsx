import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useAddress } from "../../contexts/AddressContext";
import { useToast } from "../../components/ui/use-toast";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { Checkbox } from "../../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { createOrder } from "../../api/services/orderService";
import { ShoppingBag, Truck, Wallet } from "lucide-react";
import { ImageUpload } from "../../components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function Checkout() {
  const { cart, clearCart, couponCode, discountAmount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { addresses, getDefaultAddress, saveAddressFromCheckout } =
    useAddress();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get default address if available
  const defaultAddress = getDefaultAddress();

  // Form state
  const [formData, setFormData] = useState({
    fullName: defaultAddress?.name || "",
    email: user?.email || "",
    phone: defaultAddress?.phone || "",
    address: defaultAddress?.addressLine1 || "",
    city: defaultAddress?.city || "",
    state: defaultAddress?.state || "",
    zipCode: defaultAddress?.postalCode || "",
    country: defaultAddress?.country || "",
    paymentMethod: "cashOnDelivery", // Default to cash on delivery
    shippingMethod: "standard",
    saveInfo: true,
    selectedAddressId: defaultAddress?._id || "new",
    jazzCashDetails: {
      accountNumber: "",
      paymentImage: "",
      transactionCode: "",
    },
  });

  // Generate a unique transaction code for each checkout session
  const generateNewJazzCashCode = () => {
    return (
      "JC-" +
      Math.random().toString(36).substring(2, 8).toUpperCase() +
      "-" +
      Date.now().toString().substring(6)
    );
  };

  // Use sessionStorage to keep the code consistent during the checkout session
  // but generate a new one for each new checkout session
  const [jazzCashCode] = useState<string>(() => {
    // Check if we have a stored code in sessionStorage for this checkout session
    const storedCode = sessionStorage.getItem("currentCheckoutJazzCashCode");
    if (storedCode) {
      return storedCode;
    }
    // Generate a new code and store it for this checkout session
    const newCode = generateNewJazzCashCode();
    sessionStorage.setItem("currentCheckoutJazzCashCode", newCode);
    return newCode;
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review

  // If cart is empty or user is not authenticated, redirect
  React.useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to sign in before checking out",
        variant: "destructive",
      });
      navigate("/auth");
    } else if (!cart || cart.items.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty",
        variant: "destructive",
      });
      navigate("/cart");
    }
  }, [isAuthenticated, cart, navigate, toast]);

  // Clear the transaction code when the component unmounts
  React.useEffect(() => {
    // When component unmounts, clear the code to ensure a new one for the next checkout
    return () => {
      // Only clear if the order was successfully placed
      if (sessionStorage.getItem("orderPlaced") === "true") {
        sessionStorage.removeItem("currentCheckoutJazzCashCode");
        sessionStorage.removeItem("orderPlaced");
      }
    };
  }, []);

  // Log discount information
  React.useEffect(() => {
    console.log("Checkout - Coupon applied:", couponCode);
    console.log("Checkout - Discount amount:", discountAmount);
    console.log("Checkout - Cart details:", cart);
  }, [couponCode, discountAmount, cart]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, saveInfo: checked }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJazzCashAccountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      jazzCashDetails: {
        ...prev.jazzCashDetails,
        accountNumber: value,
        transactionCode: jazzCashCode,
      },
    }));
  };

  const handleJazzCashImageUploaded = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      jazzCashDetails: {
        ...prev.jazzCashDetails,
        paymentImage: url,
        transactionCode: jazzCashCode,
      },
    }));
  };

  const validateShippingForm = () => {
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
    ];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Missing information",
          description: `Please fill in all required fields`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const validatePaymentForm = () => {
    // Only validate Jazz Cash details in step 3
    if (step === 3 && formData.paymentMethod === "jazzCash") {
      if (!formData.jazzCashDetails.accountNumber) {
        toast({
          title: "Missing information",
          description: "Please enter your Jazz Cash account number",
          variant: "destructive",
        });
        return false;
      }

      if (!formData.jazzCashDetails.paymentImage) {
        toast({
          title: "Missing information",
          description: "Please upload your payment confirmation image",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateShippingForm()) {
      return;
    }
    // No validation in step 2 since Jazz Cash details are now in step 3
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  // Unused mock function
  /*
  const saveToMockOrders = (order: any) => {
    try {
      // Get existing orders from localStorage
      const existingOrdersStr = localStorage.getItem("mockOrders");
      const existingOrders = existingOrdersStr
        ? JSON.parse(existingOrdersStr)
        : [];

      // Add the new order
      const updatedOrders = [...existingOrders, order];

      // Save back to localStorage
      localStorage.setItem("mockOrders", JSON.stringify(updatedOrders));

      console.log("Order saved to localStorage:", order.id);

      // Show success toast
      toast({
        title: "Order Saved",
        description: `Order #${order.id} has been saved successfully.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving order to localStorage:", error);
      toast({
        title: "Error Saving Order",
        description: `Failed to save order to local storage: ${
          error.message || "Unknown error"
        }`,
        variant: "destructive",
      });
    }
  };
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart) return;

    // Validate payment details before submitting
    if (!validatePaymentForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate a delay to represent order processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create order data from form and cart
      const orderData = {
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size || "M", // Default to M if size is not available
          color: item.color || "Default", // Default color if not available
          price: item.product.discountedPrice || item.product.price,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          addressLine1: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone,
        },
        shippingMethod: formData.shippingMethod,
        paymentMethod: formData.paymentMethod,
        couponCode: couponCode || null,
        discountAmount: discountAmount || 0,
        // Calculate totals for the order
        subtotal: cart.subtotal,
        tax: cart.tax,
        shippingCost: formData.shippingMethod === "standard" ? 5.99 : 14.99,
        total: cart.total,
        // Add Jazz Cash details if that payment method is selected
        jazzCashDetails:
          formData.paymentMethod === "jazzCash"
            ? {
                // Include the transaction code that was shown to the user
                transactionCode: jazzCashCode,
                accountNumber: formData.jazzCashDetails.accountNumber,
                paymentImage: formData.jazzCashDetails.paymentImage,
              }
            : undefined,
      };

      // Call create order API
      let order;
      try {
        console.log("Attempting to create order with data:", orderData);
        order = await createOrder(orderData);
        console.log("Order created successfully:", order);
      } catch (error) {
        console.error("Order creation error:", error);

        // Check if this is an authentication error
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          error.message &&
          typeof error.message === "string" &&
          error.message.includes("Authentication required")
        ) {
          toast({
            title: "Authentication Required",
            description: "You need to sign in to complete your order.",
            variant: "destructive",
          });

          // Redirect to login page
          navigate("/auth");
          setLoading(false);
          return;
        }

        // Show error toast with details
        toast({
          title: "Order Creation Failed",
          description: `Error: ${
            error && typeof error === "object" && "message" in error
              ? error.message
              : "Unknown error"
          }`,
          variant: "destructive",
        });

        // Don't proceed with order creation
        setLoading(false);
        return;
      }

      // Save address if user checked the option
      if (formData.saveInfo && formData.selectedAddressId === "new") {
        try {
          await saveAddressFromCheckout({
            name: formData.fullName,
            addressLine1: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.zipCode,
            country: formData.country,
            phone: formData.phone,
            isDefault: addresses.length === 0, // Make default if it's the first address
            type: "both",
          });
        } catch (addressError) {
          console.error("Error saving address:", addressError);
          // Continue with order process even if address saving fails
        }
      }

      // Clear cart after successful order
      await clearCart();

      // Mark the order as placed so we generate a new code for the next checkout
      sessionStorage.setItem("orderPlaced", "true");

      // Redirect to confirmation page with order ID
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description:
          "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If cart is still loading or empty
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Checkout steps */}
      <div className="flex justify-between mb-8">
        <div
          className={`flex flex-col items-center ${
            step >= 1 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            1
          </div>
          <span className="mt-2">Shipping</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div
            className={`h-1 w-full ${step >= 2 ? "bg-primary" : "bg-muted"}`}
          ></div>
        </div>
        <div
          className={`flex flex-col items-center ${
            step >= 2 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            2
          </div>
          <span className="mt-2">Payment</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div
            className={`h-1 w-full ${step >= 3 ? "bg-primary" : "bg-muted"}`}
          ></div>
        </div>
        <div
          className={`flex flex-col items-center ${
            step >= 3 ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            3
          </div>
          <span className="mt-2">Review</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Shipping Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Shipping Information
                  </h2>
                  <Separator className="mb-6" />

                  {addresses.length > 0 && (
                    <div className="mb-6">
                      <Label htmlFor="addressSelect">Select Address</Label>
                      <Select
                        value={formData.selectedAddressId}
                        onValueChange={(value) => {
                          if (value === "new") {
                            // Reset form for new address
                            setFormData((prev) => ({
                              ...prev,
                              selectedAddressId: "new",
                              fullName: "",
                              address: "",
                              city: "",
                              state: "",
                              zipCode: "",
                              country: "",
                              phone: "",
                            }));
                          } else {
                            // Find the selected address
                            const selectedAddress = addresses.find(
                              (addr) => addr._id === value
                            );
                            if (selectedAddress) {
                              setFormData((prev) => ({
                                ...prev,
                                selectedAddressId: value,
                                fullName: selectedAddress.name,
                                address: selectedAddress.addressLine1,
                                city: selectedAddress.city,
                                state: selectedAddress.state,
                                zipCode: selectedAddress.postalCode,
                                country: selectedAddress.country,
                                phone: selectedAddress.phone,
                              }));
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an address" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Add New Address</SelectItem>
                          {addresses.map((address) => (
                            <SelectItem
                              key={address._id}
                              value={address._id || ""}
                            >
                              {address.name} - {address.addressLine1},{" "}
                              {address.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Zip/Postal Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center space-x-2">
                    <Checkbox
                      id="saveInfo"
                      checked={formData.saveInfo}
                      onCheckedChange={handleCheckboxChange}
                    />
                    <Label htmlFor="saveInfo" className="text-sm">
                      Save this information for next time
                    </Label>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <Button type="button" onClick={handleNext}>
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                  <Separator className="mb-6" />

                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      handleRadioChange("paymentMethod", value)
                    }
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-4">
                      <RadioGroupItem
                        value="cashOnDelivery"
                        id="cashOnDelivery"
                      />
                      <Label
                        htmlFor="cashOnDelivery"
                        className="flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 h-5 w-5"
                        >
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="12" cy="12" r="2" />
                          <path d="M6 12h.01M18 12h.01" />
                        </svg>
                        Cash on Delivery
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-md p-4">
                      <RadioGroupItem value="jazzCash" id="jazzCash" />
                      <Label htmlFor="jazzCash" className="flex items-center">
                        <Wallet className="mr-2 h-5 w-5" />
                        Jazz Cash
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Jazz Cash payment details moved to step 3 */}

                  <h3 className="text-lg font-semibold mt-8 mb-4">
                    Shipping Method
                  </h3>
                  <RadioGroup
                    value={formData.shippingMethod}
                    onValueChange={(value) =>
                      handleRadioChange("shippingMethod", value)
                    }
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-4">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label
                        htmlFor="standard"
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center">
                          <Truck className="mr-2 h-5 w-5" />
                          Standard Shipping (3-5 business days)
                        </div>
                        <span className="font-medium">$5.99</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-4">
                      <RadioGroupItem value="express" id="express" />
                      <Label
                        htmlFor="express"
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center">
                          <Truck className="mr-2 h-5 w-5" />
                          Express Shipping (1-2 business days)
                        </div>
                        <span className="font-medium">$14.99</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="mt-8 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Back to Shipping
                    </Button>
                    <Button type="button" onClick={handleNext}>
                      Review Order
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Order Review */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Review Your Order
                  </h2>
                  <Separator className="mb-6" />

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Shipping Address
                      </h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p>{formData.fullName}</p>
                        <p>{formData.address}</p>
                        <p>
                          {formData.city}, {formData.state} {formData.zipCode}
                        </p>
                        <p>{formData.country}</p>
                        <p>{formData.phone}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Payment Method
                      </h3>
                      {formData.paymentMethod === "cashOnDelivery" ? (
                        <div className="bg-muted p-4 rounded-md flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2 h-5 w-5"
                          >
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <circle cx="12" cy="12" r="2" />
                            <path d="M6 12h.01M18 12h.01" />
                          </svg>
                          <span>Cash on Delivery</span>
                        </div>
                      ) : (
                        <div className="bg-muted p-4 rounded-md space-y-3">
                          <div className="flex items-center">
                            <Wallet className="mr-2 h-5 w-5" />
                            <span>Jazz Cash</span>
                          </div>

                          {/* Jazz Cash Payment Details - Only shown in the final step */}
                          <Card className="mt-4">
                            <CardHeader>
                              <CardTitle>Jazz Cash Payment Details</CardTitle>
                              <CardDescription>
                                Please transfer the payment to the account below
                                and provide your account number
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="bg-muted p-4 rounded-md space-y-2">
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    Bank Name:
                                  </span>
                                  <span>Jazz Cash</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    Account Number:
                                  </span>
                                  <span>03230944339</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    Account Holder:
                                  </span>
                                  <span>Abdul Kabeer</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    Transaction Code:
                                  </span>
                                  <span className="font-mono bg-primary/10 px-2 py-1 rounded">
                                    {jazzCashCode}
                                  </span>
                                </div>
                                <div className="mt-2 text-sm text-muted-foreground">
                                  <p>
                                    Please include this transaction code in your
                                    payment message. Don't worry if you miss
                                    including the code - we'll verify your
                                    payment through your account number.
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="jazzCashAccountFinal">
                                  Your Jazz Cash Account Number{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="jazzCashAccountFinal"
                                  name="jazzCashAccountFinal"
                                  value={formData.jazzCashDetails.accountNumber}
                                  onChange={handleJazzCashAccountChange}
                                  placeholder="Enter your Jazz Cash account number"
                                  required
                                />
                                <p className="text-sm text-muted-foreground">
                                  This is the account number you used to make
                                  the payment.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label>
                                  Payment Confirmation Image{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <ImageUpload
                                  onImageUploaded={handleJazzCashImageUploaded}
                                  existingImageUrl={
                                    formData.jazzCashDetails.paymentImage
                                  }
                                />
                                <p className="text-sm text-muted-foreground mt-2">
                                  Upload a screenshot of your payment
                                  confirmation.
                                  <span className="text-red-500 font-medium">
                                    {" "}
                                    This is required to complete your order.
                                  </span>
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          <div className="border-t pt-2 mt-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span className="text-muted-foreground">
                                Transaction Code:
                              </span>
                              <span className="font-mono">{jazzCashCode}</span>

                              <span className="text-muted-foreground">
                                Your Account:
                              </span>
                              <span>
                                {formData.jazzCashDetails.accountNumber ||
                                  "Not provided yet"}
                              </span>
                            </div>

                            {formData.jazzCashDetails.paymentImage ? (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground mb-1">
                                  Payment Confirmation:
                                </p>
                                <div className="h-20 w-20 relative rounded overflow-hidden">
                                  <img
                                    src={formData.jazzCashDetails.paymentImage}
                                    alt="Payment confirmation"
                                    className="object-cover h-full w-full"
                                  />
                                </div>
                                <p className="text-sm text-green-600 mt-2">
                                  Payment confirmation image uploaded
                                  successfully.
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-red-600 mt-2 font-medium">
                                Payment confirmation image is required. Please
                                provide it above.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">
                        Shipping Method
                      </h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p>
                          {formData.shippingMethod === "standard"
                            ? "Standard Shipping (3-5 business days)"
                            : "Express Shipping (1-2 business days)"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg mb-2">Order Items</h3>
                      <div className="space-y-3">
                        {cart.items.map((item, i) => (
                          <div
                            key={item.productId || i}
                            className="flex items-center space-x-4 py-3 border-b last:border-0"
                          >
                            <div className="h-16 w-16 relative rounded-md overflow-hidden flex-shrink-0">
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="object-cover h-full w-full"
                              />
                            </div>
                            <div className="flex-grow">
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Size: {item.size} | Color: {item.color} | Qty:{" "}
                                {item.quantity}
                              </p>
                            </div>
                            <div className="font-medium">
                              $
                              {(
                                (item.product.discountedPrice ||
                                  item.product.price) * item.quantity
                              ).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Back to Payment
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="min-w-[150px]"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-card rounded-lg shadow p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <Separator className="mb-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>
                  Subtotal (
                  {cart.items.reduce((acc, item) => acc + item.quantity, 0)}{" "}
                  items)
                </span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>
                  {formData.shippingMethod === "standard" ? "$5.99" : "$14.99"}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>${(cart.subtotal * 0.08).toFixed(2)}</span>
              </div>

              {/* Display coupon discount if applied */}
              {couponCode && discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    {couponCode.toUpperCase() === "FREESHIP"
                      ? "Free Shipping"
                      : couponCode.toUpperCase() === "DISCOUNT10"
                      ? "10% Discount"
                      : couponCode.toUpperCase() === "FLASH25"
                      ? "25% Discount"
                      : "Discount"}{" "}
                    ({couponCode})
                  </span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>
                  $
                  {(
                    cart.subtotal +
                    (formData.shippingMethod === "standard" ? 5.99 : 14.99) +
                    cart.subtotal * 0.08 -
                    (typeof discountAmount === "number" ? discountAmount : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {step === 3 && (
              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Processing..." : "Place Order"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
