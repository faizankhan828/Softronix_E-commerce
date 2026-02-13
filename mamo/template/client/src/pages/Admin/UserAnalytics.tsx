import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast";
import api from "../../api/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CircleDollarSign,
  ShoppingCart,
  Heart,
  Package,
  User,
} from "lucide-react";

// Types
interface UserAnalytics {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
  wishlistCount: number;
  cartCount: number;
  categories: { [key: string]: number };
}

// Colors for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function UserAnalytics() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [usersAnalytics, setUsersAnalytics] = useState<UserAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserAnalytics | null>(null);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    averageOrderValue: 0,
    categoryDistribution: [] as { name: string; value: number }[],
  });

  // Check if user is admin, otherwise redirect
  useEffect(() => {
    if (isAuthenticated && currentUser?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin analytics",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, currentUser, navigate, toast]);

  // Fetch user analytics data
  useEffect(() => {
    const fetchUserAnalytics = async () => {
      setLoading(true);
      try {
        // This would typically come from your backend API
        // For now, we'll simulate the data
        console.log("Fetching user analytics...");

        // In a real scenario, you would call your API
        // const response = await api.get("/users/analytics");
        // const data = response.data;

        // Simulated data for demonstration
        const mockUsers = await fetchUsers();
        const mockOrders = await fetchOrders();

        // Process mock data to generate analytics
        const analyticsData = generateAnalytics(mockUsers, mockOrders);

        setUsersAnalytics(analyticsData);
        calculateTotalStats(analyticsData);
      } catch (error) {
        console.error("Error fetching user analytics:", error);
        toast({
          title: "Error",
          description: "Failed to load user analytics. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserAnalytics();
  }, [toast]);

  // Helper function to fetch users (in a real app, this would be an API call)
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users?all=true");
      if (response.data && response.data.users) {
        return response.data.users;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  // Helper function to fetch orders (in a real app, this would be an API call)
  const fetchOrders = async () => {
    try {
      const response = await api.get("/orders/admin/all");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  };

  // Generate analytics from users and orders
  const generateAnalytics = (users: any[], orders: any[]): UserAnalytics[] => {
    return users.map((user) => {
      // Filter orders for this user
      const userOrders = orders.filter(
        (order) => order.userId === (user._id || user.id)
      );

      // Calculate total spent
      const totalSpent = userOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );

      // Get unique categories from orders
      const categories: { [key: string]: number } = {};
      userOrders.forEach((order) => {
        order.items.forEach((item: any) => {
          const category = item.product?.category || "unknown";
          categories[category] = (categories[category] || 0) + 1;
        });
      });

      // Random data for demo purposes
      const randomWishlistCount = Math.floor(Math.random() * 10);
      const randomCartCount = Math.floor(Math.random() * 5);

      return {
        _id: user._id || "",
        id: user.id || "",
        name:
          user.name ||
          user.email?.split("@")[0] ||
          "User" + (user._id || user.id).slice(-5),
        email:
          user.email ||
          (user.name
            ? user.name.toLowerCase().replace(/\s+/g, ".") + "@example.com"
            : "user" + (user._id || user.id).slice(-5) + "@example.com"),
        role: user.role || "user",
        totalSpent: totalSpent,
        totalOrders: userOrders.length,
        averageOrderValue:
          userOrders.length > 0 ? totalSpent / userOrders.length : 0,
        lastPurchaseDate:
          userOrders.length > 0
            ? userOrders.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )[0].createdAt
            : "Never",
        wishlistCount: randomWishlistCount,
        cartCount: randomCartCount,
        categories,
      };
    });
  };

  // Calculate overall statistics
  const calculateTotalStats = (usersData: UserAnalytics[]) => {
    const totalRevenue = usersData.reduce(
      (sum, user) => sum + user.totalSpent,
      0
    );
    const totalOrders = usersData.reduce(
      (sum, user) => sum + user.totalOrders,
      0
    );
    const activeUsers = usersData.filter((user) => user.totalOrders > 0).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate category distribution
    const allCategories: { [key: string]: number } = {};
    usersData.forEach((user) => {
      Object.entries(user.categories).forEach(([category, count]) => {
        allCategories[category] = (allCategories[category] || 0) + count;
      });
    });

    const categoryDistribution = Object.entries(allCategories).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    setTotalStats({
      totalRevenue,
      totalOrders,
      activeUsers,
      averageOrderValue,
      categoryDistribution,
    });
  };

  // Handle user selection for detailed view
  const handleUserSelect = (user: UserAnalytics) => {
    setSelectedUser(user);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">User Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow p-6 flex items-center">
          <div className="bg-primary/10 p-3 rounded-full mr-4">
            <CircleDollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <h3 className="text-2xl font-bold">
              ${totalStats.totalRevenue.toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6 flex items-center">
          <div className="bg-primary/10 p-3 rounded-full mr-4">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <h3 className="text-2xl font-bold">{totalStats.totalOrders}</h3>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6 flex items-center">
          <div className="bg-primary/10 p-3 rounded-full mr-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Users</p>
            <h3 className="text-2xl font-bold">{totalStats.activeUsers}</h3>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6 flex items-center">
          <div className="bg-primary/10 p-3 rounded-full mr-4">
            <CircleDollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg. Order Value</p>
            <h3 className="text-2xl font-bold">
              ${totalStats.averageOrderValue.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-1 bg-card rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">User Spending</h2>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersAnalytics
                  .sort((a, b) => b.totalSpent - a.totalSpent)
                  .map((user) => (
                    <TableRow
                      key={user._id || user.id}
                      className={
                        selectedUser &&
                        (selectedUser._id === user._id ||
                          selectedUser.id === user.id)
                          ? "bg-muted"
                          : ""
                      }
                    >
                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>${user.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>{user.totalOrders}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserSelect(user)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow">
          {selectedUser ? (
            <Tabs defaultValue="overview">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {selectedUser.name} ({selectedUser.email})
                  </h2>
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="purchases">Purchases</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="overview" className="p-4 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">
                      Total Spent
                    </div>
                    <div className="text-2xl font-bold">
                      ${selectedUser.totalSpent.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">Orders</div>
                    <div className="text-2xl font-bold">
                      {selectedUser.totalOrders}
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">
                      Avg. Order
                    </div>
                    <div className="text-2xl font-bold">
                      ${selectedUser.averageOrderValue.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-4">
                    <div className="text-sm text-muted-foreground">
                      Last Purchase
                    </div>
                    <div className="text-md font-bold">
                      {selectedUser.lastPurchaseDate === "Never"
                        ? "Never"
                        : new Date(
                            selectedUser.lastPurchaseDate
                          ).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Purchase Categories */}
                <div className="bg-background rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">
                    Purchase Categories
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(selectedUser.categories).map(
                            ([name, value]) => ({ name, value })
                          )}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(selectedUser.categories).map(
                            (_item, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="purchases" className="p-4">
                <div className="bg-background rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Purchase History</h3>
                  {selectedUser.totalOrders > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="text-center text-muted-foreground">
                        This user has made {selectedUser.totalOrders} orders
                        totaling ${selectedUser.totalSpent.toFixed(2)}
                      </div>
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">
                          Shopping Preferences
                        </h4>
                        <ul className="space-y-1">
                          {Object.entries(selectedUser.categories)
                            .sort(([, a], [, b]) => b - a)
                            .map(([category, count]) => (
                              <li
                                key={category}
                                className="flex justify-between"
                              >
                                <span className="capitalize">{category}</span>
                                <span className="text-muted-foreground">
                                  {count} items
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      This user hasn't made any purchases yet.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="p-4">
                <div className="space-y-6">
                  {/* Wishlist Activity */}
                  <div className="bg-background rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <Heart className="h-5 w-5 mr-2 text-rose-500" />
                      <h3 className="text-lg font-medium">Wishlist Items</h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-3xl font-bold">
                        {selectedUser.wishlistCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Items in wishlist
                      </div>
                    </div>
                  </div>

                  {/* Cart Activity */}
                  <div className="bg-background rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <ShoppingCart className="h-5 w-5 mr-2 text-blue-500" />
                      <h3 className="text-lg font-medium">Cart Items</h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-3xl font-bold">
                        {selectedUser.cartCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Items in cart
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="bg-background rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">Account Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Role
                        </div>
                        <div className="font-medium capitalize">
                          {selectedUser.role}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Customer Value
                        </div>
                        <div className="font-medium">
                          {selectedUser.totalSpent > 500
                            ? "High Value"
                            : selectedUser.totalSpent > 100
                            ? "Regular"
                            : "New Customer"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Select a user to view detailed analytics</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overall Analytics */}
      <div className="mt-8 bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Overall Shopping Category Distribution
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={totalStats.categoryDistribution}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Items Sold" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
