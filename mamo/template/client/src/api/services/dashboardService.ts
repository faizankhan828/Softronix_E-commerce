import api from "./api";

// Helper function to calculate dashboard data from raw data
const calculateDashboardData = (
  products: any[],
  orders: any[],
  users: any[]
) => {
  // Calculate total revenue
  const totalRevenue = orders.reduce(
    (sum: number, order: any) => sum + (order.totalAmount || order.total || 0),
    0
  );

  // Calculate pending orders
  const pendingOrders = orders.filter(
    (order: any) => order.status === "pending" || order.status === "processing"
  ).length;

  // Calculate low stock products
  const lowStockProducts = products.filter(
    (product: any) => product.inventory !== undefined && product.inventory < 10
  ).length;

  // Calculate sales data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split("T")[0];
  }).reverse();

  const salesByDay = last7Days.map((date) => {
    // Find orders for this date
    const dayOrders = orders.filter((order: any) => {
      const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
      return orderDate === date;
    });

    // Calculate total sales for this date
    const daySales = dayOrders.reduce(
      (sum: number, order: any) =>
        sum + (order.totalAmount || order.total || 0),
      0
    );

    return {
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      amount: daySales,
    };
  });

  // Calculate top products based on orders
  const productSales: Record<string, { count: number; revenue: number }> = {};

  // Count product occurrences in orders
  orders.forEach((order: any) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (item.productId) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              count: 0,
              revenue: 0,
            };
          }
          productSales[item.productId].count += item.quantity || 1;
          productSales[item.productId].revenue +=
            item.price * (item.quantity || 1);
        }
      });
    }
  });

  // Get top 5 products by sales count
  const topProductIds = Object.keys(productSales)
    .sort((a, b) => productSales[b].count - productSales[a].count)
    .slice(0, 5);

  // Get product details for top products
  const topProducts = topProductIds
    .map((productId) => {
      const product = products.find(
        (p: any) => p.id === productId || p._id === productId
      );
      if (!product) return null;

      return {
        id: product.id || product._id,
        name: product.name,
        price: product.price,
        sales: productSales[productId].count,
        change: 0, // Default to no change
      };
    })
    .filter((p) => p !== null);

  // Recent activity
  const recentOrdersData = orders
    .slice(0, Math.min(5, orders.length))
    .map((order: any) => ({
      id: order.id || order._id,
      status: order.status,
      customerName:
        order.shippingAddress?.name ||
        order.shippingAddress?.fullName ||
        "Customer",
      date: new Date(order.createdAt).toLocaleDateString(),
      total: order.totalAmount || order.total || 0,
    }));

  const recentUsersData = users
    .slice(0, Math.min(5, users.length))
    .map((user: any) => ({
      id: user.id || user._id || "",
      name: user.name || "User",
      email: user.email || "",
      date: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : "Recently",
      role: user.role || "customer",
    }));

  const recentProductsData = products
    .slice(0, Math.min(5, products.length))
    .map((product: any) => ({
      id: product.id || product._id,
      name: product.name,
      price: product.price,
      inventory: product.inventory || 0,
      date: product.createdAt
        ? new Date(product.createdAt).toLocaleDateString()
        : "Recently",
    }));

  // Return calculated dashboard data
  return {
    stats: {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: users.length,
      totalProducts: products.length,
      pendingOrders,
      lowStockProducts,
    },
    salesData: salesByDay,
    topProducts,
    recentActivity: {
      orders: recentOrdersData,
      users: recentUsersData,
      products: recentProductsData,
    },
    trends: {
      revenue: { value: 0, isPositive: true },
      orders: { value: 0, isPositive: true },
      customers: { value: 0, isPositive: true },
      products: { value: 0, isPositive: true },
    },
  };
};

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export interface SalesData {
  date: string;
  amount: number;
}

export interface TopProduct {
  id: string;
  name: string;
  price: number;
  sales: number;
  change: number;
}

export interface RecentActivity {
  orders: {
    id: string;
    status: string;
    customerName: string;
    date: string;
    total: number;
  }[];
  users: {
    id: string;
    name: string;
    email: string;
    date: string;
    role: string;
  }[];
  products: {
    id: string;
    name: string;
    price: number;
    inventory: number;
    date: string;
  }[];
}

export interface Trend {
  value: number;
  isPositive: boolean;
}

export interface Trends {
  revenue: Trend;
  orders: Trend;
  customers: Trend;
  products: Trend;
}

export interface DashboardData {
  stats: DashboardStats;
  salesData: SalesData[];
  topProducts: TopProduct[];
  recentActivity: RecentActivity;
  trends: Trends;
}

const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardData> => {
    // Check if user is logged in and has admin privileges
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let isAdmin = false;

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        isAdmin = userData.role === "admin";
      } catch (e) {
        // Error parsing user data
      }
    }

    // Check authentication but don't block access for development
    if (!token) {
      // No authentication token found, but proceeding anyway for development
    }

    if (!isAdmin) {
      // User is not an admin, but proceeding anyway for development
    }

    try {
      // First try the dedicated dashboard endpoint
      try {
        // Try the stats endpoint first
        try {
          const response = await api.get("/stats/dashboard");
          return response.data;
        } catch (statsError) {
          // Check if it's an authentication error
          if (
            statsError &&
            typeof statsError === "object" &&
            "response" in statsError &&
            statsError.response &&
            typeof statsError.response === "object" &&
            "status" in statsError.response &&
            statsError.response.status === 401
          ) {
            // Authentication failed for dashboard access, but proceeding anyway for development
          }

          // Stats API not available, trying manual calculation

          // If stats endpoint fails, try to calculate manually from raw data
          const productsResponse = await api.get("/products", {
            params: { admin: true },
          });
          const ordersResponse = await api.get("/orders/admin/all");
          const usersResponse = await api.get("/users?all=true");

          // If we got all the data, calculate stats manually
          if (
            productsResponse.data &&
            ordersResponse.data &&
            usersResponse.data
          ) {
            // Successfully fetched real data, calculating dashboard stats manually

            // Extract data
            const products = Array.isArray(productsResponse.data)
              ? productsResponse.data
              : productsResponse.data.products || [];

            const orders = Array.isArray(ordersResponse.data)
              ? ordersResponse.data
              : ordersResponse.data.orders || [];

            const users = Array.isArray(usersResponse.data)
              ? usersResponse.data
              : usersResponse.data.users || [];

            // Calculate dashboard data manually
            return calculateDashboardData(products, orders, users);
          }

          // If we couldn't get the raw data, throw an error
          throw new Error("Could not fetch data for dashboard");
        }
      } catch (error) {
        // Don't use mock data, throw the error to be handled by the UI
        throw error;
      }

      // This code should never be reached because we're either returning real data
      // or falling back to mock data above
    } catch (error) {
      throw error;
    }
  },
};

export default dashboardService;
