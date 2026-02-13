"use strict";
const express = require("express");
const {
  authenticateToken,
  authorizeAdmin,
  optionalAuthenticateToken,
  verifyCsrfToken,
  rateLimit,
} = require("../middleware/auth");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const StoreSettings = require("../models/StoreSettings");
const Coupon = require("../models/Coupon");

const router = express.Router();

// Apply CSRF protection to all routes except GET requests
router.use(verifyCsrfToken);

// Apply rate limiting to order operations
const orderRateLimit = rateLimit(10, 1 * 60 * 1000); // 10 attempts per minute

// Get all orders for current user
router.get("/", optionalAuthenticateToken, async (req, res) => {
  try {
    // For unauthenticated users, return empty array
    if (!req.user || !req.user.id) {
      return res.status(200).json([]);
    }

    const orders = await Order.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific order by ID
router.get("/:id", optionalAuthenticateToken, async (req, res) => {
  try {
    // For unauthenticated users, return 404
    if (!req.user || !req.user.id) {
      return res.status(404).json({ message: "Order not found" });
    }

    let order;
    if (req.user.role === "admin") {
      // Admin can fetch any order by _id
      order = await Order.findOne({ _id: req.params.id });
    } else {
      // Regular users can only fetch their own orders
      order = await Order.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new order
router.post("/", authenticateToken, orderRateLimit, async (req, res) => {
  try {
    console.log("Received order data:", req.body);

    // For unauthenticated users, return error
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Authentication required to create an order",
        requiresAuth: true,
      });
    }

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      subtotal,
      tax,
      shippingCost,
      total,
      notes,
      couponCode,
      discountAmount,
    } = req.body;

    // Validate required fields
    if (!items || !items.length || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        message:
          "Please provide all required fields (items, shipping address, payment method)",
      });
    }

    // Calculate totals if not provided
    let calculatedSubtotal = subtotal;
    if (!calculatedSubtotal) {
      calculatedSubtotal = items.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1);
      }, 0);
    }

    let calculatedTax = tax;
    if (!calculatedTax) {
      // Get store tax rate from settings
      const storeSettings = await StoreSettings.getSettings();
      const taxRate = storeSettings.taxRate / 100; // Convert percentage to decimal
      calculatedTax = calculatedSubtotal * taxRate;
    }

    let calculatedShippingCost = shippingCost;
    if (!calculatedShippingCost) {
      calculatedShippingCost = 5.99; // Default shipping cost
    }

    // Get discount amount if coupon was applied
    let calculatedDiscount = discountAmount || 0;

    // Get coupon information if a coupon code was provided
    let couponInfo = null;
    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon) {
          // Check if user has already used this coupon (if it's one-time-per-user)
          if (coupon.oneTimePerUser && coupon.usedBy.includes(req.user.id)) {
            return res.status(400).json({
              message:
                "You have already used this coupon. Each user can only use this coupon once.",
              alreadyUsed: true,
            });
          }

          // Apply the coupon to track usage and add user to usedBy array
          await coupon.apply(req.user.id);

          couponInfo = {
            couponId: coupon._id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
          };
        }
      } catch (couponError) {
        console.error("Error fetching or applying coupon:", couponError);
        // Continue with order creation even if coupon lookup fails
      }
    }

    // Get coupon info from user's cart if not provided directly
    if (!couponInfo) {
      try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (cart && cart.appliedCoupon && cart.appliedCoupon.couponId) {
          // Find the coupon in the database
          const coupon = await Coupon.findById(cart.appliedCoupon.couponId);

          if (coupon) {
            // Check if user has already used this coupon (if it's one-time-per-user)
            if (coupon.oneTimePerUser && coupon.usedBy.includes(req.user.id)) {
              return res.status(400).json({
                message:
                  "You have already used this coupon. Each user can only use this coupon once.",
                alreadyUsed: true,
              });
            }

            // Apply the coupon to track usage and add user to usedBy array
            await coupon.apply(req.user.id);

            couponInfo = {
              couponId: coupon._id,
              code: coupon.code,
              type: coupon.type,
              value: coupon.value,
            };
          } else {
            // If coupon no longer exists in database, use the info from the cart
            couponInfo = {
              couponId: cart.appliedCoupon.couponId,
              code: cart.appliedCoupon.code,
              type: cart.appliedCoupon.type,
              value: cart.appliedCoupon.value,
            };
          }

          // Use discount from cart if not provided directly
          if (!calculatedDiscount && cart.appliedCoupon.discountAmount) {
            calculatedDiscount = cart.appliedCoupon.discountAmount;
          }
        }
      } catch (cartError) {
        console.error("Error fetching cart for coupon info:", cartError);
        // Continue with order creation
      }
    }

    let calculatedTotal = total;
    if (!calculatedTotal) {
      calculatedTotal =
        calculatedSubtotal +
        calculatedTax +
        calculatedShippingCost -
        calculatedDiscount;
    }

    // Create new order
    const newOrder = new Order({
      userId: req.user.id,
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      paymentDetails: req.body.paymentDetails || {},
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      shippingCost: calculatedShippingCost,
      discount: calculatedDiscount,
      coupon: couponInfo,
      total: calculatedTotal,
      status: "pending",
      notes: notes || "",
      // Include Jazz Cash details if provided
      jazzCashDetails: req.body.jazzCashDetails,
    });

    console.log("Creating new order:", newOrder);

    // Save order to database
    const savedOrder = await newOrder.save();
    console.log("Order saved successfully:", savedOrder);

    // Clear the user's cart after successful order
    try {
      await Cart.updateOne(
        { userId: req.user.id },
        { $set: { items: [], appliedCoupon: undefined } }
      );
      console.log("Cart cleared for user:", req.user.id);
    } catch (cartError) {
      console.error("Error clearing cart:", cartError);
      // Continue with the order process even if cart clearing fails
    }

    // Format the response to match the client's expected structure
    const formattedOrder = {
      id: savedOrder.orderId,
      userId: savedOrder.userId,
      items: savedOrder.items.map((item) => ({
        product: {
          id: item.productId,
          name: item.product?.name || "Product",
          price: item.price,
          image: item.product?.image || "",
        },
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: savedOrder.total,
      shippingAddress: {
        fullName: savedOrder.shippingAddress.name,
        addressLine1: savedOrder.shippingAddress.addressLine1,
        addressLine2: savedOrder.shippingAddress.addressLine2,
        city: savedOrder.shippingAddress.city,
        state: savedOrder.shippingAddress.state,
        zipCode: savedOrder.shippingAddress.postalCode,
        country: savedOrder.shippingAddress.country,
        phone: savedOrder.shippingAddress.phone,
      },
      paymentMethod: savedOrder.paymentMethod,
      shippingMethod: req.body.shippingMethod || "standard",
      status: savedOrder.status,
      createdAt: savedOrder.createdAt,
      updatedAt: savedOrder.updatedAt,
      shippingCost: savedOrder.shippingCost,
      tax: savedOrder.tax,
      discount: savedOrder.discount || 0,
      coupon: savedOrder.coupon,
      estimatedDelivery: new Date(
        Date.now() +
          (req.body.shippingMethod === "express" ? 172800000 : 432000000)
      ).toISOString(),
      // Include Jazz Cash details if this is a Jazz Cash payment
      jazzCashDetails: savedOrder.jazzCashDetails,
    };

    res.status(201).json(formattedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel an order (only if it's still pending)
router.post(
  "/:id/cancel",
  authenticateToken,
  orderRateLimit,
  async (req, res) => {
    try {
      // For unauthenticated users, return error
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to cancel an order",
          requiresAuth: true,
        });
      }

      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only allow cancellation if order is pending or processing
      if (order.status !== "pending" && order.status !== "processing") {
        return res.status(400).json({
          message: `Cannot cancel order with status: ${order.status}`,
        });
      }

      // Update order status
      order.status = "cancelled";
      order.updatedAt = new Date();
      if (req.body.cancelReason) {
        order.notes += `\nCancellation reason: ${req.body.cancelReason}`;
      }

      await order.save();
      res.json(order);
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Admin routes

// Get all orders (admin only)
router.get(
  "/admin/all",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { status, limit = 50, page = 1 } = req.query;

      const query = {};
      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Order.countDocuments(query);

      res.json({
        orders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update Jazz Cash payment details
router.put(
  "/:id/jazz-cash-payment",
  authenticateToken,
  orderRateLimit,
  async (req, res) => {
    try {
      // For unauthenticated users, return error
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to update payment details",
          requiresAuth: true,
        });
      }

      const { jazzCashDetails } = req.body;

      if (!jazzCashDetails) {
        return res
          .status(400)
          .json({ message: "Payment details are required" });
      }

      // Find the order
      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if this is a Jazz Cash order
      if (order.paymentMethod !== "jazz_cash") {
        return res.status(400).json({
          message: "This order does not use Jazz Cash payment method",
        });
      }

      // Update the Jazz Cash details
      if (!order.jazzCashDetails) {
        order.jazzCashDetails = {};
      }

      // Only update the fields that are provided
      if (jazzCashDetails.accountNumber) {
        order.jazzCashDetails.accountNumber = jazzCashDetails.accountNumber;
      }

      if (jazzCashDetails.paymentImage) {
        order.jazzCashDetails.paymentImage = jazzCashDetails.paymentImage;
        // If payment image is provided, mark as payment confirmed
        order.jazzCashDetails.paymentConfirmed = true;

        // Add a note about the payment confirmation
        order.notes += `\n${new Date().toISOString()} - Jazz Cash payment confirmation image uploaded.`;
      }

      await order.save();

      res.json({
        id: order._id,
        orderId: order.orderId,
        jazzCashDetails: order.jazzCashDetails,
        status: order.status,
        message: "Payment details updated successfully",
      });
    } catch (error) {
      console.error("Error updating Jazz Cash payment details:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update order status (admin only)
router.put(
  "/:id/status",
  authenticateToken,
  authorizeAdmin,
  orderRateLimit,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = status;
      order.updatedAt = new Date();

      if (req.body.notes) {
        order.notes += `\n${new Date().toISOString()} - Status updated to ${status}: ${
          req.body.notes
        }`;
      }

      await order.save();
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
