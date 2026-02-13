import React from "react";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../contexts/OrderContext";
import {
  Order,
  OrderItem as OrderItemType,
} from "../api/services/orderService";
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

// Extended OrderItem with additional properties needed by the component
interface ExtendedOrderItem extends OrderItemType {
  name?: string;
  image?: string;
}

const OrderItem = ({ item }: { item: ExtendedOrderItem }) => {
  return (
    <div className="flex items-center space-x-4 py-2 border-b last:border-b-0">
      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
        <img
          src={item.image || "/placeholder.png"}
          alt={item.name || "Product"}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {item.name || "Product"}
        </p>
        <div className="flex text-xs text-gray-500">
          {item.color && <span className="mr-2">Color: {item.color}</span>}
          {item.size && <span>Size: {item.size}</span>}
        </div>
        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
      </div>
      <div className="text-sm font-medium text-gray-900">
        {item.price !== undefined ? formatCurrency(item.price) : "$0.00"}
      </div>
    </div>
  );
};

const OrderCard = ({
  order,
  onViewDetails,
}: {
  order: Order;
  onViewDetails: (id: string) => void;
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
      <div className="flex flex-col sm:flex-row justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500">
            Order #{order.id ? order.id.substring(0, 8) : "N/A"}
          </p>
          <p className="text-sm text-gray-500">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="mt-2 sm:mt-0">
          <OrderStatus status={order.status} />
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="flow-root">
          <div className="-my-2">
            {order.items.slice(0, 2).map((item, index) => (
              <OrderItem key={index} item={item} />
            ))}
            {order.items.length > 2 && (
              <p className="text-sm text-gray-500 mt-2">
                + {order.items.length - 2} more items
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 pt-3 border-t">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Total:{" "}
            {order.totalAmount !== undefined
              ? formatCurrency(order.totalAmount)
              : "$0.00"}
          </p>
          <p className="text-xs text-gray-500">
            Payment: {order.paymentMethod}
          </p>
        </div>
        <div className="mt-3 sm:mt-0 w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => order.id && onViewDetails(order.id)}
          >
            View Details
          </Button>
          {order.status.toLowerCase() !== "cancelled" &&
            order.status.toLowerCase() !== "delivered" && (
              <Button
                variant="ghost"
                className="mt-2 w-full sm:w-auto text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                Cancel Order
              </Button>
            )}
        </div>
      </div>
    </div>
  );
};

const OrderHistorySkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
        >
          <div className="flex justify-between mb-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="border-t pt-3">
            <div className="space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center space-x-4">
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
          </div>
          <div className="flex justify-between items-center mt-4 pt-3 border-t">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyOrderHistory = () => {
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        You haven't placed any orders yet. Start shopping to see your orders
        here.
      </p>
      <Button className="mt-6" onClick={() => navigate("/shop")}>
        Browse Products
      </Button>
    </div>
  );
};

const OrderHistory: React.FC = () => {
  const { orders, error } = useOrder();
  const loading = false; // Hardcoded for now since loading is not in OrderContextType
  const navigate = useNavigate();

  const handleViewOrderDetails = (orderId: string) => {
    navigate(`/account/orders/${orderId}`);
  };

  if (loading) {
    return <OrderHistorySkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading orders
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                There was an error loading your order history. Please try again
                later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return <EmptyOrderHistory />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Order History</h2>
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onViewDetails={handleViewOrderDetails}
        />
      ))}
    </div>
  );
};

export default OrderHistory;
