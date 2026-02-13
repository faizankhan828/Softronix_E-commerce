import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "../../contexts/OrderContext";
import { Order } from "../../api/services/orderService";
import { Button } from "../../components/ui/button";
// import { Badge } from "../../components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { formatDate, formatCurrency } from "../../lib/utils";
import productService from "../../api/services/productService";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  image?: string; // For backward compatibility
}

interface OrderItem {
  id?: string;
  _id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  total?: number;
  color?: string;
  size?: string;
  variant?: {
    color?: string;
    size?: string;
  };
}

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

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrder, cancelUserOrder } = useOrder();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [enrichedItems, setEnrichedItems] = useState<OrderItem[]>([]);
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

  // Fetch product details for each order item
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!order || !order.items || order.items.length === 0) return;

      try {
        const updatedItems = await Promise.all(
          order.items.map(async (item) => {
            // Skip if product details already exist
            if (
              item.product?.name &&
              item.product?.images &&
              item.product?.images.length > 0
            ) {
              return item;
            }

            try {
              // Fetch product details using productId
              const productId =
                item.productId || (item.product && item.product.id);
              if (!productId) return item;

              const productData = await productService.getProductById(
                productId
              );

              return {
                ...item,
                product: {
                  id: productData.id,
                  name: productData.name,
                  price: productData.price,
                  images: productData.images || [],
                },
              };
            } catch (err) {
              console.error(`Error fetching product ${item.productId}:`, err);
              return item;
            }
          })
        );

        // @ts-ignore - TypeScript doesn't recognize that this is valid
        setEnrichedItems(updatedItems);
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    };

    fetchProductDetails();
  }, [order]);

  const handleCancelOrder = async () => {
    if (!order || !orderId) return;

    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await cancelUserOrder(orderId);
        // Update the local order state
        setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      } catch (error) {
        console.error("Error cancelling order:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
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
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/account/orders")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-xl font-semibold">
            Order #
            {order._id || order.orderId || order.id
              ? (order._id || order.orderId || order.id || "")
                  .toString()
                  .substring(0, 8)
              : "Unknown"}
          </h1>
        </div>
        <div>
          <OrderStatus status={order.status} />
        </div>
      </div>

      {/* Order Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg mb-6">
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
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-4">Items in Your Order</h3>
        <div className="rounded-md border">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-muted">
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-medium"
                >
                  Item
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-medium"
                >
                  Variant
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-sm font-medium"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-sm font-medium"
                >
                  Qty
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-right text-sm font-medium"
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(enrichedItems.length > 0 ? enrichedItems : order.items).map(
                (item, index) => (
                  <tr key={index}>
                    <td className="py-4 pl-4 pr-3 text-sm">
                      <div className="flex items-center">
                        <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                          <img
                            src={
                              (item as any).image ||
                              item.product?.image ||
                              (item.product?.images &&
                              item.product.images.length > 0
                                ? item.product.images[0]
                                : null) ||
                              "https://via.placeholder.com/80?text=No+Image"
                            }
                            alt={
                              (item as any).name ||
                              item.product?.name ||
                              "Product"
                            }
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/80?text=No+Image";
                            }}
                          />
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {(item as any).name ||
                              item.product?.name ||
                              "Product"}
                          </p>
                          <div className="flex text-xs text-gray-500 mt-1">
                            {((item as any).color ||
                              (item as any).variant?.color) && (
                              <span className="mr-2">
                                Color:{" "}
                                {(item as any).color ||
                                  (item as any).variant?.color}
                              </span>
                            )}
                            {((item as any).size ||
                              (item as any).variant?.size) && (
                              <span>
                                Size:{" "}
                                {(item as any).size ||
                                  (item as any).variant?.size}
                              </span>
                            )}
                          </div>
                          {item.product?.id && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto mt-1 text-sm text-blue-600"
                              onClick={() =>
                                navigate(`/product/${item.product?.id}`)
                              }
                            >
                              View Product
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <div>
                        {(item.color || item.variant?.color) && (
                          <span className="block">
                            Color: {item.color || item.variant?.color}
                          </span>
                        )}
                        {(item.size || item.variant?.size) && (
                          <span className="block">
                            Size: {item.size || item.variant?.size}
                          </span>
                        )}
                        {!item.color &&
                          !item.variant?.color &&
                          !item.size &&
                          !item.variant?.size && (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-right">
                      {formatCurrency(item.price || 0)}
                    </td>
                    <td className="px-3 py-4 text-sm text-right">
                      {item.quantity || 1}
                    </td>
                    <td className="px-3 py-4 text-sm text-right font-medium">
                      {formatCurrency(
                        item.total ||
                          (item.price !== undefined
                            ? item.price * (item.quantity || 1)
                            : 0) ||
                          0
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <th
                  scope="row"
                  colSpan={4}
                  className="pl-4 pr-3 py-3.5 text-right text-sm font-medium"
                >
                  Subtotal
                </th>
                <td className="px-3 py-3.5 text-right text-sm font-medium">
                  {formatCurrency(
                    (order.totalAmount || order.total || 0) -
                      (order.shippingCost || 0)
                  )}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  colSpan={4}
                  className="pl-4 pr-3 py-3.5 text-right text-sm font-medium"
                >
                  Shipping
                </th>
                <td className="px-3 py-3.5 text-right text-sm font-medium">
                  {formatCurrency(order.shippingCost || 0)}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  colSpan={4}
                  className="pl-4 pr-3 py-3.5 text-right text-sm font-medium border-t"
                >
                  Total
                </th>
                <td className="px-3 py-3.5 text-right text-sm font-medium border-t">
                  {formatCurrency(order.totalAmount || order.total || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
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
              onClick={handleCancelOrder}
            >
              Cancel Order
            </Button>
          )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;
