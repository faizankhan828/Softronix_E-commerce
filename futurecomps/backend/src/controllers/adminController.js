import User from "../models/User.js";

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
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });
    const adminUsers = await User.countDocuments({ role: "admin" });
    const regularUsers = await User.countDocuments({ role: "user" });

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      verifiedUsers,
      unverifiedUsers,
      adminUsers,
      regularUsers,
      recentUsers,
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
