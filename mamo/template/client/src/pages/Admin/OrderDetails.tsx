import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast";
import AdminLayout from "../../components/layouts/AdminLayout";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { ArrowLeft, Wallet } from "lucide-react";
import api from "../../api/services/api";
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

interface JazzCashDetails {
  transactionCode: string;
  accountNumber?: string;
  paymentImage?: string;
  paymentConfirmed?: boolean;
}

interface Order {
  id?: string;
  _id?: string;
  orderId?: string;
  customerId?: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  items: OrderItem[];
  total?: number;
  totalAmount?: number;
  subTotal?: number;
  shippingCost?: number;
  discount?: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus?: "paid" | "pending" | "failed";
  paymentMethod?: string;
  shippingAddress: {
    fullName?: string;
    name?: string;
    line1?: string;
    addressLine1?: string;
    line2?: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode?: string;
    zipCode?: string;
    country: string;
    phone?: string;
  };
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  jazzCashDetails?: JazzCashDetails;
}

export default function AdminOrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [enrichedItems, setEnrichedItems] = useState<OrderItem[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      setLoading(true);
      try {
        const response = await api.get(`/orders/${orderId}`);
        const orderData = response.data;
        setOrder(orderData);
        setStatus(orderData.status);
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, toast]);

  // Fetch product details for each order item
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!order || !order.items || order.items.length === 0) return;

      try {
        const updatedItems = await Promise.all(
          order.items.map(async (item) => {
            // Skip if product details already exist
            if (item.product?.name && item.product?.images?.length > 0) {
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

        setEnrichedItems(updatedItems);
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    };

    fetchProductDetails();
  }, [order]);

  const formatAddress = (address: Order["shippingAddress"]) => {
    if (!address) return "No address provided";

    const parts = [
      address.line1 || address.addressLine1,
      address.line2 || address.addressLine2,
      address.city,
      address.state,
      address.postalCode || address.zipCode,
      address.country,
    ].filter(Boolean);

    return parts.join(", ");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  const handleUpdateStatus = async () => {
    if (!order || !orderId) return;

    try {
      // Use the MongoDB _id if available
      const mongoId = order._id || order.id || order.orderId;

      // Call API to update the order status
      // @ts-ignore - response is not used
      const response = await api.put(`/orders/${mongoId}/status`, {
        status: status,
      });

      toast({
        title: "Success",
        description: `Order status updated to ${status}`,
      });

      // Update the local order state
      // @ts-ignore - TypeScript doesn't recognize that this is valid
      setOrder((prev) => (prev ? { ...prev, status } : null));
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin?tab=orders")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </div>
          <div className="bg-red-50 text-red-800 p-6 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
            <p>
              The order you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin?tab=orders")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <h1 className="text-2xl font-bold">
              Order #{order._id || order.orderId || order.id}
            </h1>
          </div>
          <Badge className={getStatusColor(order.status || "pending")}>
            {(order.status || "pending").charAt(0).toUpperCase() +
              (order.status || "pending").slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Customer Information
            </h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">
                {order.customerName ||
                  order.shippingAddress?.fullName ||
                  order.shippingAddress?.name ||
                  "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.customerEmail || "No email provided"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Order Details
            </h3>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm">Order Date:</span>
                <span className="text-sm font-medium">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-sm">Payment:</span>
                <div className="flex items-center gap-2">
                  {order.paymentMethod && (
                    <span className="text-sm font-medium">
                      {order.paymentMethod === "cash_on_delivery"
                        ? "Cash on Delivery"
                        : order.paymentMethod === "jazz_cash"
                        ? "Jazz Cash"
                        : order.paymentMethod === "credit_card"
                        ? "Credit Card"
                        : order.paymentMethod}
                    </span>
                  )}
                  {order.paymentStatus ? (
                    <Badge
                      className={getPaymentStatusColor(order.paymentStatus)}
                    >
                      {order.paymentStatus.charAt(0).toUpperCase() +
                        order.paymentStatus.slice(1)}
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
                  )}
                </div>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between mt-1">
                  <span className="text-sm">Tracking:</span>
                  <span className="text-sm font-medium">
                    {order.trackingNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Shipping Address
          </h3>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">{formatAddress(order.shippingAddress)}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Order Items
          </h3>
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
                    <tr key={item.id || item._id || `item-${index}`}>
                      <td className="py-4 pl-4 pr-3 text-sm">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-md border overflow-hidden">
                            <img
                              src={
                                item.product?.images?.[0] ||
                                item.product?.image ||
                                "/placeholder.png"
                              }
                              alt={item.product?.name || "Product"}
                              className="h-full w-full object-cover object-center"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.png";
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">
                              {item.product?.name ||
                                item.productId ||
                                "Unknown Product"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div>
                          {true && (
                            <a
                              href={`/product/${item.productId}`}
                              className="text-primary underline text-sm hover:text-primary/80 mt-1 inline-block"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Product
                            </a>
                          )}
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
                        ${(item.price || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-4 text-sm text-right">
                        {item.quantity || 1}
                      </td>
                      <td className="px-3 py-4 text-sm text-right font-medium">
                        $
                        {(
                          item.total ||
                          item.price * (item.quantity || 1) ||
                          0
                        ).toFixed(2)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <th
                    scope="row"
                    colSpan={4}
                    className="pl-4 pr-3 py-3.5 text-right text-sm font-medium"
                  >
                    Subtotal
                  </th>
                  <td className="px-3 py-3.5 text-right text-sm font-medium">
                    ${(order.subTotal || 0).toFixed(2)}
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
                    ${(order.shippingCost || 0).toFixed(2)}
                  </td>
                </tr>
                {order.discount && order.discount > 0 && (
                  <tr>
                    <th
                      scope="row"
                      colSpan={4}
                      className="pl-4 pr-3 py-3.5 text-right text-sm font-medium"
                    >
                      Discount
                    </th>
                    <td className="px-3 py-3.5 text-right text-sm font-medium text-red-500">
                      -${(order.discount || 0).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr>
                  <th
                    scope="row"
                    colSpan={4}
                    className="pl-4 pr-3 py-3.5 text-right text-sm font-medium"
                  >
                    Total
                  </th>
                  <td className="px-3 py-3.5 text-right text-sm font-medium">
                    ${(order.total || order.totalAmount || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Jazz Cash Payment Details */}
        {order.paymentMethod === "jazz_cash" && order.jazzCashDetails && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Jazz Cash Payment Details
            </h3>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Wallet className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Jazz Cash Payment</span>
                {order.jazzCashDetails.paymentConfirmed && (
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    Payment Confirmed
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <span className="text-muted-foreground">Transaction Code:</span>
                <span className="font-mono">
                  {order.jazzCashDetails.transactionCode}
                </span>

                {order.jazzCashDetails.accountNumber && (
                  <>
                    <span className="text-muted-foreground">
                      Customer Account:
                    </span>
                    <span>{order.jazzCashDetails.accountNumber}</span>
                  </>
                )}
              </div>

              {order.jazzCashDetails.paymentImage ? (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    Payment Confirmation Image:
                  </p>
                  <div className="h-40 w-40 relative rounded overflow-hidden border border-gray-300">
                    <img
                      src={order.jazzCashDetails.paymentImage}
                      alt="Payment confirmation"
                      className="object-cover h-full w-full"
                      onError={(e) => {
                        console.error(
                          "Image failed to load:",
                          order.jazzCashDetails?.paymentImage
                        );
                        e.currentTarget.src = "/placeholder.png";
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-red-500">
                    No payment confirmation image provided
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {order.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Notes
            </h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-line">{order.notes}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleUpdateStatus}
            disabled={status === order.status}
          >
            Update Status
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
