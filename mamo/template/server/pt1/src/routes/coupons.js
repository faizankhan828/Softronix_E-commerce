const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");

const router = express.Router();

// Get all coupons (admin only)
router.get("/", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific coupon by ID (admin only)
router.get("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
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
});

// Create a new coupon (admin only)
router.post("/", authenticateToken, authorizeAdmin, async (req, res) => {
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
});

// Update a coupon (admin only)
router.put("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
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
});

// Delete a coupon (admin only)
router.delete("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
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
});

// Validate a coupon code (available to all authenticated users)
router.post("/validate", authenticateToken, async (req, res) => {
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

      // We're allowing future start dates for admin testing

      if (cartTotal < coupon.minPurchase) {
        return res.status(400).json({
          valid: false,
          message: `Minimum purchase of $${coupon.minPurchase.toFixed(
            2
          )} required`,
        });
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usageCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          valid: false,
          message: "This coupon has reached its usage limit",
        });
      }

      if (coupon.oneTimePerUser && coupon.usedBy.includes(req.user.id)) {
        console.log(
          `User ${req.user.id} has already used coupon ${coupon.code} (validation check)`
        );
        return res.status(400).json({
          valid: false,
          message:
            "You have already used this coupon. Each user can only use this coupon once.",
          alreadyUsed: true,
        });
      }

      if (
        coupon.userRestriction.length > 0 &&
        !coupon.userRestriction.includes(req.user.id)
      ) {
        return res.status(400).json({
          valid: false,
          message: "This coupon is not available for your account",
        });
      }

      return res.status(400).json({
        valid: false,
        message: "This coupon cannot be applied",
      });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(cartTotal);

    // Return discount information
    res.json({
      valid: true,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
      },
      discountAmount,
      message: `Coupon applied: ${coupon.description}`,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      valid: false,
      message: "Server error during coupon validation",
    });
  }
});

// Apply a coupon to a cart
router.post("/apply", authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate cart total
    const cartTotal = cart.items.reduce((total, item) => {
      const price = item.product.discountedPrice || item.product.price;
      return total + price * item.quantity;
    }, 0);

    // Check if user has already used this coupon (if it's one-time-per-user)
    // We check this first, separately from isValid, to provide a clearer error message
    if (coupon.oneTimePerUser && coupon.usedBy.includes(req.user.id)) {
      console.log(`User ${req.user.id} has already used coupon ${coupon.code}`);
      return res.status(400).json({
        message:
          "You have already used this coupon. Each user can only use this coupon once.",
        alreadyUsed: true,
      });
    }

    // Check coupon validity
    if (!coupon.isValid(req.user.id, cartTotal)) {
      // Provide more specific error messages
      if (
        coupon.usageLimit !== null &&
        coupon.usageCount >= coupon.usageLimit
      ) {
        return res.status(400).json({
          message: "This coupon has reached its usage limit",
          limitReached: true,
        });
      }

      if (cartTotal < coupon.minPurchase) {
        return res.status(400).json({
          message: `Minimum purchase of $${coupon.minPurchase.toFixed(
            2
          )} required`,
          minPurchaseNotMet: true,
        });
      }

      return res.status(400).json({ message: "Coupon cannot be applied" });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(cartTotal);

    // Apply coupon (update usage statistics)
    await coupon.apply(req.user.id);

    // Store coupon information in the cart
    cart.appliedCoupon = {
      couponId: coupon._id,
      code: coupon.code,
      discountAmount: discountAmount,
      type: coupon.type,
    };
    await cart.save();

    // Return updated cart details with discount
    res.json({
      discountAmount,
      couponCode: coupon.code,
      cartTotal,
      finalTotal: cartTotal - discountAmount,
      message: `Coupon applied: ${coupon.description}`,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ message: "Server error during coupon application" });
  }
});

// Public endpoint to get coupon info without authentication
// This doesn't update usage statistics and is for display purposes only
router.get("/public/:code", async (req, res) => {
  try {
    const { code } = req.params;

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

    // Check if coupon is active and not expired
    const now = new Date();
    if (!coupon.isActive || now > coupon.endDate) {
      return res.status(400).json({
        valid: false,
        message: coupon.isActive
          ? "This coupon has expired"
          : "This coupon is inactive",
      });
    }

    // Return coupon info without checking other restrictions
    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        minPurchase: coupon.minPurchase,
      },
      message: "Coupon is valid",
    });
  } catch (error) {
    console.error("Error getting public coupon info:", error);
    res.status(500).json({
      valid: false,
      message: "Server error",
    });
  }
});

// Create a test coupon (for development only)
router.post("/create-test", async (req, res) => {
  try {
    // Check if the test coupon already exists
    const existingCoupon = await Coupon.findOne({ code: "TEST20" });
    if (existingCoupon) {
      return res.status(200).json({
        message: "Test coupon already exists",
        coupon: existingCoupon,
      });
    }

    // Create a new coupon
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 30); // Valid for 30 days

    const newCoupon = new Coupon({
      code: "TEST20",
      description: "Test coupon - 20% off",
      type: "percentage",
      value: 20,
      minPurchase: 10,
      maxDiscount: 100,
      startDate: now,
      endDate: endDate,
      isActive: true,
      usageLimit: 100,
      oneTimePerUser: false,
    });

    // Save the coupon
    const savedCoupon = await newCoupon.save();
    res.status(201).json({
      message: "Test coupon created successfully",
      coupon: savedCoupon,
    });
  } catch (error) {
    console.error("Error creating test coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove a coupon from the cart
router.post("/remove", authenticateToken, async (req, res) => {
  try {
    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove coupon
    cart.appliedCoupon = undefined;
    await cart.save();

    res.json({ message: "Coupon removed successfully" });
  } catch (error) {
    console.error("Error removing coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
