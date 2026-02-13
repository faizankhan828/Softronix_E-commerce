const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await Product.countDocuments();

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total orders and calculate revenue
    const orders = await Order.find();
    const totalOrders = orders.length;

    // Calculate total revenue
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.totalAmount || order.total || 0),
      0
    );

    // Calculate pending orders
    const pendingOrders = await Order.countDocuments({
      status: { $in: ["pending", "processing"] },
    });

    // Calculate low stock products (inventory less than 10)
    const lowStockProducts = await Product.countDocuments({
      inventory: { $lt: 10, $gte: 0 },
    });

    // Get recent orders with populated product data
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("items.product")
      .lean();

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent products
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculate sales data for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const salesByDay = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        // Find orders for this date
        const dayOrders = await Order.find({
          createdAt: { $gte: date, $lt: nextDay },
        });

        // Calculate total sales for this date
        const daySales = dayOrders.reduce(
          (sum, order) => sum + (order.totalAmount || order.total || 0),
          0
        );

        return {
          date: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          amount: daySales,
        };
      })
    );

    // Calculate top products based on order items
    const productSales = {};

    // Count product occurrences in orders
    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
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
    const topProducts = await Promise.all(
      topProductIds.map(async (productId) => {
        const product = await Product.findById(productId);
        if (!product) return null;

        return {
          id: product._id.toString(),
          name: product.name,
          price: product.price,
          sales: productSales[productId].count,
          revenue: productSales[productId].revenue,
          // Random change percentage for demo purposes
          change: Math.floor(Math.random() * 40) - 20,
        };
      })
    ).then((products) => products.filter((p) => p !== null));

    // Return dashboard statistics
    res.json({
      stats: {
        totalRevenue,
        totalOrders,
        totalCustomers: totalUsers,
        totalProducts,
        pendingOrders,
        lowStockProducts,
      },
      salesData: salesByDay,
      topProducts,
      recentActivity: {
        orders: recentOrders.map((order) => ({
          id: order._id ? order._id.toString() : "unknown",
          status: order.status || "pending",
          customerName:
            order.shippingAddress?.name ||
            order.shippingAddress?.fullName ||
            "Customer",
          date: order.createdAt
            ? new Date(order.createdAt).toLocaleDateString()
            : "Unknown",
          total: order.totalAmount || order.total || 0,
        })),
        users: recentUsers.map((user) => ({
          id: user._id ? user._id.toString() : "unknown",
          name: user.name || "User",
          email: user.email || "unknown@example.com",
          date: user.createdAt
            ? new Date(user.createdAt).toLocaleDateString()
            : "Recently",
          role: user.role || "customer",
        })),
        products: recentProducts.map((product) => ({
          id: product._id ? product._id.toString() : "unknown",
          name: product.name || "Unknown Product",
          price: product.price || 0,
          inventory: product.inventory || 0,
          date: product.createdAt
            ? new Date(product.createdAt).toLocaleDateString()
            : "Recently",
        })),
      },
      // Calculate trends (comparing to previous period)
      // In a real app, you would calculate these based on historical data
      trends: {
        revenue: { value: 15, isPositive: true },
        orders: { value: 8, isPositive: true },
        customers: { value: 5, isPositive: true },
        products: { value: 3, isPositive: true },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    // Get total orders
    const totalOrders = await Order.countDocuments();

    // Get orders by status
    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const processingOrders = await Order.countDocuments({
      status: "processing",
    });
    const shippedOrders = await Order.countDocuments({ status: "shipped" });
    const deliveredOrders = await Order.countDocuments({ status: "delivered" });
    const cancelledOrders = await Order.countDocuments({ status: "cancelled" });

    // Calculate total revenue
    const orders = await Order.find();
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.totalAmount || order.total || 0),
      0
    );

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Return order statistics
    res.json({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus: {
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getDashboardStats,
  getOrderStats,
};
