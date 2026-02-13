import Coupon from "../models/Coupon.js";
import Cart from "../models/Cart.js";
import {
  createStripeCoupon,
  deactivateStripeCoupon,
} from "../services/stripeService.js";

// ── Admin: Create Coupon ────────────────────────────────

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      expiresAt,
      usageLimit,
      onePerUser,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res
        .status(400)
        .json({
          message: "code, discountType, and discountValue are required",
        });
    }

    // Check duplicate
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount ?? null,
      expiresAt: expiresAt || null,
      usageLimit: usageLimit ?? null,
      onePerUser: onePerUser ?? true,
      source: "manual",
      createdBy: req.user._id,
    });

    await coupon.save();

    // Sync to Stripe
    const stripeResult = await createStripeCoupon(coupon);
    coupon.stripeCouponId = stripeResult.stripeCouponId;
    coupon.stripePromotionCodeId = stripeResult.stripePromotionCodeId;
    await coupon.save();

    res.status(201).json(coupon);
  } catch (error) {
    console.error("createCoupon error:", error);
    res.status(500).json({ message: "Failed to create coupon" });
  }
};

// ── Admin: List All Coupons ─────────────────────────────

export const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 50, source } = req.query;
    const filter = {};
    if (source) filter.source = source;

    const skip = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    res.json({
      coupons,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
};

// ── Admin: Deactivate Coupon ────────────────────────────

export const deactivateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    coupon.isActive = false;
    await coupon.save();

    // Deactivate on Stripe
    await deactivateStripeCoupon(coupon.stripeCouponId);

    res.json({ message: "Coupon deactivated", coupon });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate coupon" });
  }
};

// ── Public: Validate Coupon ─────────────────────────────

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Get user's cart subtotal for validation
    const cart = await Cart.findOne({ userId: req.user._id });
    const subtotal = cart
      ? cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      : 0;

    const validation = coupon.isValid(subtotal, req.user._id);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    const discount = coupon.calculateDiscount(subtotal);

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount: discount,
      subtotal,
      newTotal: Math.round((subtotal - discount) * 100) / 100,
    });
  } catch (error) {
    console.error("validateCoupon error:", error);
    res.status(500).json({ message: "Failed to validate coupon" });
  }
};

// ── Authenticated: Apply Coupon to Cart ─────────────────

export const applyCouponToCart = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const subtotal = cart.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

    const validation = coupon.isValid(subtotal, req.user._id);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    cart.appliedCoupon = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    };

    await cart.save();

    res.json({
      message: "Coupon applied",
      cart: {
        items: cart.items,
        appliedCoupon: cart.appliedCoupon,
        subtotal: cart.subtotal,
        discount: cart.discount,
        total: cart.total,
      },
    });
  } catch (error) {
    console.error("applyCouponToCart error:", error);
    res.status(500).json({ message: "Failed to apply coupon" });
  }
};

// ── Authenticated: Remove Coupon from Cart ──────────────

export const removeCouponFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.appliedCoupon = { code: null, discountType: null, discountValue: 0 };
    await cart.save();

    res.json({
      message: "Coupon removed",
      cart: {
        items: cart.items,
        appliedCoupon: cart.appliedCoupon,
        subtotal: cart.subtotal,
        discount: cart.discount,
        total: cart.total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove coupon" });
  }
};
