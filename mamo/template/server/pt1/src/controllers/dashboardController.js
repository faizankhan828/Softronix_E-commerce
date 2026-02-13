const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get product count
    const productCount = await Product.countDocuments();
    
    // Get user count
    const userCount = await User.countDocuments();
    
    // Get order count and total revenue
    const orders = await Order.find();
    const orderCount = orders.length;
    
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0);
    }, 0);
    
    // Calculate pending orders
    const pendingOrders = orders.filter(
      order => order.status === 'pending' || order.status === 'processing'
    ).length;
    
    // Calculate low stock products (inventory less than 10)
    const lowStockProducts = await Product.countDocuments({
      inventory: { $lt: 10, $gte: 0 }
    });
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);
      
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);
      
    // Get recent products
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Calculate sales data for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const salesByDay = last7Days.map(date => {
      // Find orders for this date
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === date;
      });
      
      // Calculate total sales for this date
      const daySales = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: daySales
      };
    });
    
    // Calculate top products based on order items
    const productSales = {};
    
    // Count product occurrences in orders
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.productId) {
            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                count: 0,
                revenue: 0
              };
            }
            productSales[item.productId].count += item.quantity || 1;
            productSales[item.productId].revenue += (item.price * (item.quantity || 1));
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
        const product = await Product.findOne({ id: productId });
        if (!product) return null;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          sales: productSales[productId].count,
          revenue: productSales[productId].revenue,
          // Random change percentage for demo purposes
          change: Math.floor(Math.random() * 40) - 20
        };
      })
    ).then(products => products.filter(p => p !== null));
    
    // Return dashboard statistics
    res.json({
      stats: {
        totalRevenue,
        totalOrders: orderCount,
        totalCustomers: userCount,
        totalProducts: productCount,
        pendingOrders,
        lowStockProducts
      },
      salesData: salesByDay,
      topProducts,
      recentActivity: {
        orders: recentOrders.map(order => ({
          id: order.id,
          status: order.status,
          customerName: order.shippingAddress?.fullName || 'Customer',
          date: new Date(order.createdAt).toLocaleDateString(),
          total: order.totalAmount || 0
        })),
        users: recentUsers.map(user => ({
          id: user.id || user._id,
          name: user.name || 'User',
          email: user.email,
          date: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently',
          role: user.role || 'customer'
        })),
        products: recentProducts.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          inventory: product.inventory || 0,
          date: product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Recently'
        }))
      },
      // Calculate trends (comparing to previous period)
      // In a real app, you would calculate these based on historical data
      trends: {
        revenue: { value: 15, isPositive: true },
        orders: { value: 8, isPositive: true },
        customers: { value: 5, isPositive: true },
        products: { value: 3, isPositive: true }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats
};
