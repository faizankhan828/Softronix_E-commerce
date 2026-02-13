import api from "./api";

// Helper function to calculate dashboard data from raw data
const calculateDashboardData = (
  products: any[],
  orders: any[],
  users: any[],
) => {
  // Calculate total revenue
  const totalRevenue = orders.reduce(
    (sum: number, order: any) => sum + (order.totalAmount || order.total || 0),
    0,
  );

  // Calculate pending orders
  const pendingOrders = orders.filter(
    (order: any) => order.status === "pending" || order.status === "processing",
  ).length;

  // Calculate low stock products
  const lowStockProducts = products.filter(
    (product: any) => product.stock !== undefined && product.stock < 10,
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
      0,
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
        (p: any) => p.id === productId || p._id === productId,
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
      stock: product.stock || 0,
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
    stock: number;
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
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    // Fetch /admin/stats (accurate DB counts) and raw data (for charts) in parallel
    const [statsResult, productsResult, ordersResult, usersResult] =
      await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/products", { params: { admin: true, limit: 100 } }),
        api.get("/admin/orders"),
        api.get("/admin/users"),
      ]);

    // Check if all raw-data fetches failed (likely auth issue)
    if (
      productsResult.status === "rejected" &&
      ordersResult.status === "rejected" &&
      usersResult.status === "rejected"
    ) {
      const err = productsResult.reason;
      if (err?.response?.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }
      throw new Error("Could not fetch data for dashboard");
    }

    // Extract raw data arrays from paginated responses
    const productsData =
      productsResult.status === "fulfilled" ? productsResult.value.data : null;
    const ordersData =
      ordersResult.status === "fulfilled" ? ordersResult.value.data : null;
    const usersData =
      usersResult.status === "fulfilled" ? usersResult.value.data : null;

    const products = Array.isArray(productsData)
      ? productsData
      : productsData?.products || [];
    const orders = Array.isArray(ordersData)
      ? ordersData
      : ordersData?.orders || [];
    const users = Array.isArray(usersData) ? usersData : usersData?.users || [];

    // Build stats – prefer /admin/stats (accurate MongoDB counts & aggregated revenue)
    let stats: DashboardStats;
    if (statsResult.status === "fulfilled") {
      const d = statsResult.value.data;
      stats = {
        totalRevenue: d.revenue?.total ?? 0,
        totalOrders: d.orders?.total ?? 0,
        totalCustomers: d.users?.total ?? 0,
        totalProducts: d.products?.total ?? 0,
        pendingOrders: d.orders?.pending ?? 0,
        lowStockProducts: d.products?.outOfStock ?? 0,
      };
    } else {
      // Fallback: derive from paginated raw data (may under-count)
      const totalRevenue = orders.reduce(
        (sum: number, o: any) => sum + (o.totalAmount || o.total || 0),
        0,
      );
      const pendingOrders = orders.filter(
        (o: any) => o.status === "pending" || o.status === "processing",
      ).length;
      const lowStockProducts = products.filter(
        (p: any) => p.stock !== undefined && p.stock < 10,
      ).length;

      stats = {
        totalRevenue,
        totalOrders: ordersData?.total || orders.length,
        totalCustomers: usersData?.pagination?.total || users.length,
        totalProducts: productsData?.total || products.length,
        pendingOrders,
        lowStockProducts,
      };
    }

    // Calculate salesData, topProducts, recentActivity from raw items
    const computed = calculateDashboardData(products, orders, users);

    return {
      ...computed,
      stats, // override with accurate counts when available
    };
  },
};

export default dashboardService;
