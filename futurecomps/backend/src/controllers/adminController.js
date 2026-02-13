import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const isActive = req.query.isActive || "";

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      filter.role = role;
    }
    if (isActive !== "") {
      filter.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select(
        "-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (role, isActive, etc.)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { role, isActive, isVerified, name, email, phone, bio } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === user._id.toString() && isActive === false) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account" });
    }

    // Update fields if provided
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;

    const updatedUser = await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // User stats
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      verifiedUsers,
      unverifiedUsers,
      adminUsers,
      regularUsers,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isVerified: false }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    // Product stats
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      featuredProducts,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, stock: 0 }),
      Product.countDocuments({ isActive: true, isFeatured: true }),
    ]);

    // Order stats
    const [totalOrders, paidOrders, pendingOrders, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: "paid" }),
        Order.countDocuments({ status: "pending" }),
        Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      ]);

    // Revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalDiscount: { $sum: "$discount" },
        },
      },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalDiscounts = revenueResult[0]?.totalDiscount || 0;

    // Recent revenue (7 days)
    const recentRevenueResult = await Order.aggregate([
      { $match: { status: "paid", createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: null, revenue: { $sum: "$total" } } },
    ]);
    const recentRevenue = recentRevenueResult[0]?.revenue || 0;

    // Coupon stats
    const [totalCoupons, activeCoupons, negotiationCoupons] = await Promise.all(
      [
        Coupon.countDocuments(),
        Coupon.countDocuments({ isActive: true }),
        Coupon.countDocuments({ source: "negotiation" }),
      ],
    );

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        admins: adminUsers,
        regular: regularUsers,
        recentSignups: recentUsers,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts,
        featured: featuredProducts,
      },
      orders: {
        total: totalOrders,
        paid: paidOrders,
        pending: pendingOrders,
        recent: recentOrders,
      },
      revenue: {
        total: Math.round(totalRevenue * 100) / 100,
        recent7Days: Math.round(recentRevenue * 100) / 100,
        totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      },
      coupons: {
        total: totalCoupons,
        active: activeCoupons,
        fromNegotiation: negotiationCoupons,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk update users (activate/deactivate multiple)
// @route   POST /api/admin/users/bulk-update
// @access  Private/Admin
export const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide an array of user IDs" });
    }

    if (
      !action ||
      !["activate", "deactivate", "verify", "delete"].includes(action)
    ) {
      return res.status(400).json({
        message:
          "Please provide a valid action: activate, deactivate, verify, or delete",
      });
    }

    // Prevent admin from bulk updating themselves
    const adminId = req.user._id.toString();
    const filteredUserIds = userIds.filter((id) => id !== adminId);

    let result;
    switch (action) {
      case "activate":
        result = await User.updateMany(
          { _id: { $in: filteredUserIds } },
          { isActive: true },
        );
        break;
      case "deactivate":
        result = await User.updateMany(
          { _id: { $in: filteredUserIds } },
          { isActive: false },
        );
        break;
      case "verify":
        result = await User.updateMany(
          { _id: { $in: filteredUserIds } },
          { isVerified: true },
        );
        break;
      case "delete":
        result = await User.deleteMany({ _id: { $in: filteredUserIds } });
        break;
    }

    res.json({
      message: `Bulk ${action} completed successfully`,
      modifiedCount: result.modifiedCount || result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── Admin: Get All Orders ───────────────────────────────

export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("getAllOrders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ── Admin: Update Order Status ──────────────────────────

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          message: `Invalid status. Must be: ${validStatuses.join(", ")}`,
        });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

// ── Admin: View Negotiation Coupons ─────────────────────

export const getNegotiationCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find({ source: "negotiation" })
        .populate("negotiationMeta.userId", "name email")
        .populate("negotiationMeta.productId", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Coupon.countDocuments({ source: "negotiation" }),
    ]);

    res.json({
      coupons,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("getNegotiationCoupons error:", error);
    res.status(500).json({ message: "Failed to fetch negotiation coupons" });
  }
};

// ── Admin: Set Bottom Price for Product ─────────────────

export const setBottomPrice = async (req, res) => {
  try {
    const { hiddenBottomPrice, negotiationEnabled } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (hiddenBottomPrice !== undefined) {
      if (hiddenBottomPrice < 0) {
        return res
          .status(400)
          .json({ message: "Bottom price cannot be negative" });
      }
      if (hiddenBottomPrice >= product.price) {
        return res
          .status(400)
          .json({ message: "Bottom price must be less than selling price" });
      }
      product.hiddenBottomPrice = hiddenBottomPrice;
    }

    if (negotiationEnabled !== undefined) {
      product.negotiationEnabled = negotiationEnabled;
    }

    await product.save();

    res.json({
      message: "Pricing updated",
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        hiddenBottomPrice: product.hiddenBottomPrice,
        negotiationEnabled: product.negotiationEnabled,
      },
    });
  } catch (error) {
    console.error("setBottomPrice error:", error);
    res.status(500).json({ message: "Failed to update pricing" });
  }
};
