const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");

// Get all coupons (admin only)
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a specific coupon by ID (admin only)
const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new coupon (admin only)
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      applicableProducts,
      excludedProducts,
      applicableCategories,
      userRestriction,
      oneTimePerUser,
    } = req.body;

    // Validate required fields
    if (!code || !description || !type || value === undefined || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    // Create new coupon
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      description,
      type,
      value,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      startDate: startDate || new Date(),
      endDate,
      usageLimit: usageLimit || null,
      applicableProducts: applicableProducts || [],
      excludedProducts: excludedProducts || [],
      applicableCategories: applicableCategories || [],
      userRestriction: userRestriction || [],
      oneTimePerUser: oneTimePerUser || false,
    });

    // Save coupon
    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a coupon (admin only)
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Update fields
    const updateData = { ...req.body };

    // Ensure code is uppercase if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();

      // Check if new code already exists (if changed)
      if (updateData.code !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code: updateData.code });
        if (existingCoupon) {
          return res
            .status(400)
            .json({ message: "Coupon code already exists" });
        }
      }
    }

    // Apply updates
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedCoupon);
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a coupon (admin only)
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Validate a coupon code (available to all authenticated users)
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        valid: false,
        message: "Invalid coupon code",
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || !cart.items.length) {
      return res.status(400).json({
        valid: false,
        message: "Cart is empty",
      });
    }

    // Calculate cart total
    const cartTotal = cart.items.reduce((total, item) => {
      const price = item.product.discountedPrice || item.product.price;
      return total + price * item.quantity;
    }, 0);

    // Check coupon validity
    if (!coupon.isValid(req.user.id, cartTotal)) {
      // Determine specific reason for invalidity
      const now = new Date();

      if (!coupon.isActive) {
        return res.status(400).json({
          valid: false,
          message: "This coupon is inactive",
        });
      }

      if (now > coupon.endDate) {
        return res.status(400).json({
          valid: false,
          message: "This coupon has expired",
        });
      }

      if (now < coupon.startDate) {
        return res.status(400).json({
          valid: false,
          message: "This coupon is not active yet",
        });
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({
          valid: false,
          message: "This coupon has reached its usage limit",
        });
      }

      if (
        coupon.userRestriction.length > 0 &&
        !coupon.userRestriction.includes(req.user.id)
      ) {
        return res.status(400).json({
          valid: false,
          message: "This coupon is not applicable to your account",
        });
      }

      if (coupon.oneTimePerUser && coupon.usedBy.includes(req.user.id)) {
        return res.status(400).json({
          valid: false,
          message: "You have already used this coupon",
        });
      }

      if (cartTotal < coupon.minPurchase) {
        return res.status(400).json({
          valid: false,
          message: `This coupon requires a minimum purchase of $${coupon.minPurchase.toFixed(
            2
          )}`,
        });
      }
    }

    // Calculate discount based on coupon type
    let discount = 0;
    if (coupon.type === "percentage") {
      discount = cartTotal * (coupon.value / 100);
    } else if (coupon.type === "fixed") {
      discount = coupon.value;
    } else if (coupon.type === "free_shipping") {
      // Assuming shipping cost is calculated elsewhere
      discount = 0; // Will be handled by the cart logic
    }

    // Apply max discount if specified
    if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    // Return coupon details
    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
      },
      discount,
      message: "Coupon applied successfully",
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Apply a coupon to the cart
const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate cart total
    const cartTotal = cart.items.reduce((total, item) => {
      const price = item.product.discountedPrice || item.product.price;
      return total + price * item.quantity;
    }, 0);

    // Check coupon validity
    if (!coupon.isValid(userId, cartTotal)) {
      const now = new Date();

      if (!coupon.isActive) {
        return res.status(400).json({ message: "This coupon is inactive" });
      }

      if (now > coupon.endDate) {
        return res.status(400).json({ message: "This coupon has expired" });
      }

      if (now < coupon.startDate) {
        return res
          .status(400)
          .json({ message: "This coupon is not active yet" });
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({
          message: "This coupon has reached its usage limit",
        });
      }

      if (
        coupon.userRestriction.length > 0 &&
        !coupon.userRestriction.includes(userId)
      ) {
        return res.status(400).json({
          message: "This coupon is not applicable to your account",
        });
      }

      if (coupon.oneTimePerUser && coupon.usedBy.includes(userId)) {
        return res.status(400).json({
          message: "You have already used this coupon",
        });
      }

      if (cartTotal < coupon.minPurchase) {
        return res.status(400).json({
          message: `This coupon requires a minimum purchase of $${coupon.minPurchase.toFixed(
            2
          )}`,
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "percentage") {
      discount = cartTotal * (coupon.value / 100);
    } else if (coupon.type === "fixed") {
      discount = coupon.value;
    } else if (coupon.type === "free_shipping") {
      // Free shipping will be handled in order processing
      discount = 0;
    }

    // Apply max discount if specified
    if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    // Store coupon in cart
    cart.appliedCoupon = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
    };

    // Save cart
    await cart.save();

    // Return updated cart
    res.json({
      message: "Coupon applied successfully",
      appliedCoupon: cart.appliedCoupon,
      discount,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove a coupon from the cart
const removeCoupon = async (req, res) => {
  try {
    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove coupon
    cart.appliedCoupon = null;
    await cart.save();

    res.json({ message: "Coupon removed successfully" });
  } catch (error) {
    console.error("Error removing coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  removeCoupon,
};
