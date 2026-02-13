import { useState, useEffect } from "react";
import { useToast } from "../../components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  TruckIcon,
  AlertCircle,
} from "lucide-react";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

interface Order {
  id?: string;
  _id?: string;
  orderId?: string; // Added for compatibility with MongoDB _id vs orderId
  userId: string;
  items: OrderItem[];
  totalAmount?: number;
  total?: number; // Added for backward compatibility
  shippingAddress: {
    fullName?: string;
    name?: string; // Added for backward compatibility
    addressLine1: string;
    city: string;
    state: string;
    zipCode?: string;
    postalCode?: string; // Added for backward compatibility
    country: string;
    phone: string;
  };
  paymentMethod: string;
  shippingMethod: string;
  status: StatusColorKey;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

// Define status colors type
type StatusColorKey =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type StatusColors = {
  [key in StatusColorKey]: {
    bg: string;
    text: string;
    variant: string;
  };
};

// Define status colors
const statusColors: StatusColors = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", variant: "outline" },
  processing: { bg: "bg-blue-100", text: "text-blue-800", variant: "outline" },
  shipped: { bg: "bg-purple-100", text: "text-purple-800", variant: "outline" },
  delivered: { bg: "bg-green-100", text: "text-green-800", variant: "outline" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", variant: "outline" },
};

export default function OrdersTable({
  orders,
  loading,
  // onViewDetails, // Unused parameter
  onUpdateStatus,
}: OrdersTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  // Check if orders data is valid
  useEffect(() => {
    if (!Array.isArray(orders)) {
      setHasError(true);
      toast({
        title: "Error",
        description: "Invalid orders data format",
        variant: "destructive",
      });
    } else {
      setHasError(false);
    }
  }, [orders, toast]);

  // Get unique statuses for filter
  const uniqueStatuses = Array.from(
    new Set(orders.map((order) => order.status))
  );

  // Filter orders based on search and filters
  const filteredOrders = orders
    .filter((order) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        (order.id &&
          order.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.shippingAddress.fullName &&
          order.shippingAddress.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (order.trackingNumber &&
          order.trackingNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      // Time filter
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const matchesTime =
        timeFilter === "all" ||
        (timeFilter === "today" && daysDiff < 1) ||
        (timeFilter === "this-week" && daysDiff < 7) ||
        (timeFilter === "this-month" && daysDiff < 30) ||
        (timeFilter === "this-year" && daysDiff < 365);

      return matchesSearch && matchesStatus && matchesTime;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium">Error Loading Orders</h3>
        <p className="text-muted-foreground text-center max-w-md">
          There was a problem loading the order data. Please try refreshing the
          page or contact support if the issue persists.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="text-sm text-muted-foreground">
          {orders.length} total orders
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by order ID, customer name or tracking number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order, index) => (
                <TableRow key={order.id || order.orderId || `order-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>
                        {order.orderId || order.id
                          ? (order.orderId || order.id || "").substring(0, 8)
                          : "N/A"}
                        ...
                      </span>
                      {order.trackingNumber && (
                        <span className="text-xs text-muted-foreground flex items-center mt-1">
                          <TruckIcon className="h-3 w-3 mr-1" />
                          {order.trackingNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                    <div className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {order.shippingAddress.fullName ||
                        order.shippingAddress.name ||
                        "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.country}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">
                      ${(order.totalAmount || order.total || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`${
                        statusColors[order.status as StatusColorKey]?.bg ||
                        "bg-gray-100"
                      } ${
                        statusColors[order.status as StatusColorKey]?.text ||
                        "text-gray-800"
                      } hover:${
                        statusColors[order.status as StatusColorKey]?.bg ||
                        "bg-gray-100"
                      }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(
                              `/admin/orders/${
                                order._id || order.orderId || order.id
                              }`
                            )
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        {[
                          "pending",
                          "processing",
                          "shipped",
                          "delivered",
                          "cancelled",
                        ].map((status) => (
                          <DropdownMenuItem
                            key={status}
                            disabled={order.status === status}
                            onClick={() => {
                              // Use any available ID field, with _id taking precedence
                              const orderId =
                                order._id || order.orderId || order.id;
                              if (orderId) onUpdateStatus(orderId, status);
                            }}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                statusColors[status as StatusColorKey]?.bg ||
                                "bg-gray-100"
                              }`}
                            ></div>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
