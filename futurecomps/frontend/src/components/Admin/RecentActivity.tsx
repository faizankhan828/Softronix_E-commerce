import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs";
import { ShoppingBag, User, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";

interface Order {
  id: string;
  status: string;
  customerName: string;
  date: string;
  total: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  date: string;
  role: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  inventory: number;
  date: string;
}

interface RecentActivityProps {
  recentOrders: Order[];
  recentUsers: User[];
  recentProducts: Product[];
  isLoading?: boolean;
}

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        >
          Pending
        </Badge>
      );
    case "processing":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 hover:bg-blue-100"
        >
          Processing
        </Badge>
      );
    case "shipped":
      return (
        <Badge
          variant="outline"
          className="bg-purple-100 text-purple-800 hover:bg-purple-100"
        >
          Shipped
        </Badge>
      );
    case "delivered":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Delivered
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 hover:bg-red-100"
        >
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Helper function to get inventory status
const getInventoryStatus = (inventory: number) => {
  if (inventory <= 0) {
    return (
      <Badge
        variant="outline"
        className="bg-red-100 text-red-800 hover:bg-red-100"
      >
        Out of Stock
      </Badge>
    );
  } else if (inventory < 10) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      >
        Low Stock
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="bg-green-100 text-green-800 hover:bg-green-100"
      >
        In Stock
      </Badge>
    );
  }
};

// Helper function to get user role badge
const getRoleBadge = (role: string) => {
  switch (role.toLowerCase()) {
    case "admin":
      return (
        <Badge
          variant="outline"
          className="bg-purple-100 text-purple-800 hover:bg-purple-100"
        >
          Admin
        </Badge>
      );
    case "customer":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 hover:bg-blue-100"
        >
          Customer
        </Badge>
      );
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
};

export default function RecentActivity({
  recentOrders,
  recentUsers,
  recentProducts,
  isLoading = false,
}: RecentActivityProps) {
  const [activeTab, setActiveTab] = useState("orders");

  // Loading skeleton for orders
  const OrdersSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest orders, users, and products in your store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {isLoading ? (
              <OrdersSkeleton />
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Order #{order.id.substring(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.date}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  View All Orders
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No Recent Orders</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                  When customers place orders, they will appear here.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {isLoading ? (
              <OrdersSkeleton />
            ) : recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Joined {user.date}
                        </p>
                      </div>
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  View All Users
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No Recent Users</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                  When new users register, they will appear here.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {isLoading ? (
              <OrdersSkeleton />
            ) : recentProducts.length > 0 ? (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Added {product.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">
                          ${product.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.inventory}
                        </p>
                      </div>
                      {getInventoryStatus(product.inventory)}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  View All Products
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No Recent Products</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                  When you add new products, they will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
