import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "../../contexts/OrderContext";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Check, ChevronRight, Truck, Wallet } from "lucide-react";
import { Order } from "../../api/services/orderService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder } = useOrder();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  // Jazz Cash payment details

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        console.log("Fetching order with ID:", orderId);
        const orderData = await getOrder(orderId);
        console.log("Order data received:", orderData);
        setOrder(orderData);
      } catch (error) {
        console.error("Error fetching order:", error);

        // Show error in the UI
        console.error("Error fetching order data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, getOrder]);

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };


  if (loading) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 text-red-600 rounded-full p-3 inline-block mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find the order details. The order might have been
            cancelled or the link is invalid.
          </p>
          <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <div className="bg-green-100 text-green-600 rounded-full p-3 inline-block mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been received and is
              being processed.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-8">
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium">
                  ${order.totalAmount ? order.totalAmount.toFixed(2) : "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{order.paymentMethod}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Order Status</h2>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                    <div className="absolute top-8 bottom-0 left-1/2 w-0.5 bg-primary -translate-x-1/2 h-8"></div>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center mt-8">
                  <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Estimated Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      {order.estimatedDelivery
                        ? formatDate(order.estimatedDelivery)
                        : "Calculating..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 py-4 border-b last:border-0"
                  >
                    <div className="h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={item.product?.image || "/placeholder.png"}
                        alt={item.product?.name || "Product"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.product?.name || "Product"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>
                      $
                      {(
                        (order.totalAmount || 0) -
                        (order.shippingCost || 0) -
                        (order.tax || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      $
                      {order.shippingCost
                        ? order.shippingCost.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${order.tax ? order.tax.toFixed(2) : "0.00"}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>
                      $
                      {order.totalAmount
                        ? order.totalAmount.toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">
                Shipping Information
              </h2>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-2">{order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Jazz Cash Payment Details - only show if payment method is Jazz Cash */}
            {order.paymentMethod === "jazz_cash" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Jazz Cash Payment Details
                </h2>

                {/* Show existing payment details if available */}
                {order.jazzCashDetails && (
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <div className="flex items-center mb-3">
                      <Wallet className="h-5 w-5 mr-2 text-primary" />
                      <span className="font-medium">Jazz Cash Payment</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Transaction Code:
                      </span>
                      <span className="font-mono bg-primary/10 px-2 py-1 rounded">
                        {order.jazzCashDetails.transactionCode}
                      </span>

                      {order.jazzCashDetails.accountNumber && (
                        <>
                          <span className="text-muted-foreground">
                            Your Account:
                          </span>
                          <span>{order.jazzCashDetails.accountNumber}</span>
                        </>
                      )}

                      {order.jazzCashDetails.paymentConfirmed && (
                        <div className="col-span-2 mt-2">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                            Payment Confirmed
                          </span>
                        </div>
                      )}
                    </div>

                    {order.jazzCashDetails.paymentImage && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          Payment Confirmation:
                        </p>
                        <div className="h-32 w-32 relative rounded overflow-hidden">
                          <img
                            src={order.jazzCashDetails.paymentImage}
                            alt="Payment confirmation"
                            className="object-cover h-full w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Show payment details - we don't need an update form since payment is already confirmed */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Confirmed</CardTitle>
                    <CardDescription>
                      Your Jazz Cash payment has been received and confirmed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Bank Name:</span>
                        <span>Jazz Cash</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Transaction Code:</span>
                        <span className="font-mono bg-primary/10 px-2 py-1 rounded">
                          {order.jazzCashDetails?.transactionCode || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Account Number:</span>
                        <span>
                          {order.jazzCashDetails?.accountNumber ||
                            "Not provided"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-green-600">
                        <p>
                          Your payment has been confirmed. Thank you for your
                          purchase!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
            <Button
              variant="outline"
              onClick={() => navigate("/account/orders")}
            >
              View All Orders <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
