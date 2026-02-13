import { useEffect } from "react";
import { useOrder } from "../../contexts/OrderContext";
import { useAuth } from "../../contexts/AuthContext";
import { Package, X, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Orders = () => {
  const { orders, isLoading, error, fetchOrders, cancelUserOrder } = useOrder();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelUserOrder(orderId);
      toast({
        title: "Success",
        description: "Order cancelled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Error loading orders: {error}</p>
        <Button onClick={() => fetchOrders()}>Try Again</Button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-center mb-4">
          <Package size={48} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No Orders Yet</h2>
        <p className="text-muted-foreground mb-6">
          You haven't placed any orders yet.
        </p>
        <Button asChild>
          <Link to="/shop">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">My Orders</h1>

      <div className="space-y-4 sm:space-y-6">
        {orders.map((order) => (
          <div
            key={order._id || order.orderId || order.id}
            className="border rounded-lg overflow-hidden shadow-sm"
          >
            <div className="bg-muted/30 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-2 sm:gap-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h3 className="font-medium text-sm sm:text-base">
                    Order #
                    {order._id || order.orderId || order.id
                      ? (order._id || order.orderId || order.id || "").slice(-6)
                      : "Unknown"}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs w-fit ${getStatusColor(
                      order.status || "pending"
                    )}`}
                  >
                    {order.status
                      ? order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)
                      : "Pending"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Placed on{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "Unknown date"}
                </p>
              </div>

              {order.status && order.status.toLowerCase() !== "cancelled" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3"
                  onClick={() =>
                    order._id || order.orderId || order.id
                      ? handleCancelOrder(
                          (order._id || order.orderId || order.id) as string
                        )
                      : null
                  }
                >
                  <X className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Cancel Order</span>
                  <span className="sm:hidden">Cancel</span>
                </Button>
              )}
            </div>

            <div className="p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div
                      key={`${
                        order._id || order.orderId || order.id
                      }-item-${index}-${
                        item.productId || item.product?.id || "unknown"
                      }`}
                      className="flex items-center space-x-3 sm:space-x-4"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        <img
                          src={
                            item.product?.image ||
                            (item.product?.images &&
                            item.product.images.length > 0
                              ? item.product.images[0]
                              : null) ||
                            "https://placehold.co/100x100?text=No+Image"
                          }
                          alt={item.product?.name || "Product"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/100x100?text=No+Image";
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {item.product?.name || "Unknown Product"}
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          <span>Qty: {item.quantity || 1}</span>
                          {(item.variant?.color || item.color) && (
                            <span className="ml-2">
                              Color: {item.variant?.color || item.color}
                            </span>
                          )}
                          {(item.variant?.size || item.size) && (
                            <span className="ml-2">
                              Size: {item.variant?.size || item.size}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${item.price ? item.price.toFixed(2) : "0.00"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No items in this order</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>
                    $
                    {(
                      (order.totalAmount || order.total || 0) -
                      (order.shippingCost || 0) -
                      (order.tax || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium">Shipping:</span>
                  <span>${(order.shippingCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-medium">Tax:</span>
                  <span>${(order.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">
                    ${(order.totalAmount || order.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {order.shippingAddress && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  <p className="text-sm text-muted-foreground">
                    {order.shippingAddress.fullName ||
                      order.shippingAddress.name ||
                      "Customer"}
                    <br />
                    {order.shippingAddress.addressLine1 ||
                      order.shippingAddress.line1 ||
                      "Address not available"}
                    {order.shippingAddress.city
                      ? `, ${order.shippingAddress.city}`
                      : ""}
                    <br />
                    {order.shippingAddress.state
                      ? `${order.shippingAddress.state} `
                      : ""}
                    {order.shippingAddress.zipCode ||
                      order.shippingAddress.postalCode ||
                      ""}
                    <br />
                    {order.shippingAddress.country || ""}
                    {order.shippingAddress.phone && (
                      <>
                        <br />
                        Phone: {order.shippingAddress.phone}
                      </>
                    )}
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={`/account/orders/${
                      order._id || order.orderId || order.id
                    }`}
                  >
                    View Details <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
