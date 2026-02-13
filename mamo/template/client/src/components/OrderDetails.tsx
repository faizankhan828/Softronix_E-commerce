import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "../contexts/OrderContext";
import { Order } from "../api/services/orderService";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { formatDate, formatCurrency } from "../lib/utils";

const OrderStatus = ({ status }: { status: string }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-700";

  switch (status.toLowerCase()) {
    case "processing":
      bgColor = "bg-blue-100";
      textColor = "text-blue-700";
      break;
    case "shipped":
      bgColor = "bg-purple-100";
      textColor = "text-purple-700";
      break;
    case "delivered":
      bgColor = "bg-green-100";
      textColor = "text-green-700";
      break;
    case "cancelled":
      bgColor = "bg-red-100";
      textColor = "text-red-700";
      break;
  }

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const OrderDetailsSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="mt-4 sm:mt-0">
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4 py-4 border-b">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
};

const OrderNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <svg
        className="w-16 h-16 text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900">Order not found</h3>
      <p className="mt-1 text-sm text-gray-500">
        We couldn't find the order you're looking for. It might have been
        removed or you may have followed an invalid link.
      </p>
      <div className="mt-6 flex space-x-4">
        <Button variant="outline" onClick={() => navigate("/account/orders")}>
          Back to Orders
        </Button>
        <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
      </div>
    </div>
  );
};

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrder } = useOrder();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        setLoading(true);
        setError(null);
        try {
          const orderData = await getOrder(orderId);
          setOrder(orderData);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching order details:", err);
          setError("Failed to load order details");
          setLoading(false);
        }
      };

      fetchOrder();
    }
  }, [orderId, getOrder]);

  if (loading) {
    return <OrderDetailsSkeleton />;
  }

  if (error || !order) {
    return <OrderNotFound />;
  }

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Order #
            {order._id || order.orderId || order.id
              ? // @ts-ignore
                (order._id || order.orderId || order.id)
                  .toString()
                  .substring(0, 8)
              : "Unknown"}
          </h1>
          <p className="text-sm text-gray-600">
            Placed on{" "}
            {order.createdAt ? formatDate(order.createdAt) : "Unknown date"}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <OrderStatus status={order.status} />
        </div>
      </div>

      {/* Order Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
          <p className="text-sm text-gray-800">
            {order.shippingAddress?.fullName ||
              order.shippingAddress?.name ||
              "Name not available"}
          </p>
          <p className="text-sm text-gray-800">
            {order.shippingAddress?.addressLine1 ||
              order.shippingAddress?.line1 ||
              "Address not available"}
          </p>
          <p className="text-sm text-gray-800">
            {order.shippingAddress?.city || ""}
            {order.shippingAddress?.city && order.shippingAddress?.state
              ? ", "
              : ""}
            {order.shippingAddress?.state || ""}{" "}
            {order.shippingAddress?.zipCode ||
              order.shippingAddress?.postalCode ||
              ""}
          </p>
          <p className="text-sm text-gray-800">
            {order.shippingAddress?.country || ""}
          </p>
          {order.shippingAddress?.phone && (
            <p className="text-sm text-gray-800">
              Phone: {order.shippingAddress.phone}
            </p>
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
          <p className="text-sm text-gray-800">
            {order.paymentMethod || "Not specified"}
          </p>
          <p className="text-sm text-gray-800">
            Status: {(order as any).paymentStatus || "Unknown"}
          </p>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Shipping Method</h3>
          <p className="text-sm text-gray-800">
            {order.shippingMethod || "Standard Shipping"}
          </p>
          <p className="text-sm text-gray-800">
            {order.status === "delivered" && order.updatedAt
              ? "Delivered on " + formatDate(order.updatedAt)
              : order.estimatedDelivery
              ? "Estimated delivery date: " +
                formatDate(new Date(order.estimatedDelivery))
              : "Estimated delivery date: " +
                formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Items in Your Order</h3>
        <div className="space-y-4">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 py-4 border-b"
              >
                <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden">
                  <img
                    src={
                      (item as any).image ||
                      item.product?.image ||
                      (item.product?.images && item.product.images.length > 0
                        ? item.product.images[0]
                        : null) ||
                      "https://via.placeholder.com/80?text=No+Image"
                    }
                    alt={(item as any).name || item.product?.name || "Product"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/80?text=No+Image";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {(item as any).name || item.product?.name || "Product"}
                  </p>
                  <div className="flex text-xs text-gray-500 mt-1">
                    {((item as any).color || (item as any).variant?.color) && (
                      <span className="mr-2">
                        Color:{" "}
                        {(item as any).color || (item as any).variant?.color}
                      </span>
                    )}
                    {((item as any).size || (item as any).variant?.size) && (
                      <span>
                        Size:{" "}
                        {(item as any).size || (item as any).variant?.size}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Qty: {item.quantity || 1}
                  </p>
                  {item.product?.id && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-1 text-sm text-blue-600"
                      onClick={() => navigate(`/product/${item.product?.id}`)}
                    >
                      View Product
                    </Button>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.price || 0)}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">No items in this order</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">
              {formatCurrency(
                (order.totalAmount || order.total || 0) -
                  (order.shippingCost || 0)
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900">
              {formatCurrency(order.shippingCost || 0)}
            </span>
          </div>
          <div className="flex justify-between font-medium pt-2 border-t">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">
              {formatCurrency(order.totalAmount || order.total || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
        <Button variant="outline" onClick={() => navigate("/account/orders")}>
          Back to Orders
        </Button>
        {order.status &&
          order.status.toLowerCase() !== "cancelled" &&
          order.status.toLowerCase() !== "delivered" && (
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              Cancel Order
            </Button>
          )}
      </div>
    </div>
  );
};

export default OrderDetails;
