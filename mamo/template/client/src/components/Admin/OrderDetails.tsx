import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useState, useEffect } from "react";
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

export interface Order {
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
}

interface OrderDetailsProps {
  order: Order;
  open?: boolean;
  onClose?: () => void;
  onUpdateStatus: (status: string) => void;
}

const OrderDetails = ({
  order,
  open,
  onClose,
  onUpdateStatus,
}: OrderDetailsProps) => {
  const [status, setStatus] = useState(order?.status || "pending");
  const [enrichedItems, setEnrichedItems] = useState<OrderItem[]>([]);

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
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.join(", ");
  };

  const formatDate = (dateString: string) => {
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
    setStatus(newStatus as Order["status"]);
  };

  const handleUpdateStatus = () => {
    onUpdateStatus(status);
  };

  if (!order) return null;

  // If used within a Dialog (with open and onClose props)
  if (typeof open !== "undefined" && onClose) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center justify-between">
              <span>Order #{order.id}</span>
              <Badge className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Customer Information
              </h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customerEmail}
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

          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Shipping Address
            </h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">{formatAddress(order.shippingAddress)}</p>
            </div>
          </div>

          <div className="mt-6">
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
                                <span className="text-muted-foreground">
                                  N/A
                                </span>
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

          {order.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Notes
              </h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-line">{order.notes}</p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-2">
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
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // If used directly without Dialog wrapper
  return (
    <div className="p-4">
      {/* Same content as in DialogContent but without the Dialog wrapper */}
      <div className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            Order #{order._id || order.orderId || order.id}
          </h2>
          <Badge className={getStatusColor(order.status || "pending")}>
            {(order.status || "pending").charAt(0).toUpperCase() +
              (order.status || "pending").slice(1)}
          </Badge>
        </div>

        {/* Rest of the content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                {order.paymentStatus ? (
                  <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus.charAt(0).toUpperCase() +
                      order.paymentStatus.slice(1)}
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
                )}
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

        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Shipping Address
          </h3>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">{formatAddress(order.shippingAddress)}</p>
          </div>
        </div>

        <div className="mt-6">
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

        {order.notes && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Notes
            </h3>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-line">{order.notes}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
};

export default OrderDetails;
