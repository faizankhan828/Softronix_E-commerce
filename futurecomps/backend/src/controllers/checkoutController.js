import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import {
  createCheckoutSession,
  constructWebhookEvent,
} from "../services/stripeService.js";

// ── POST /api/payment/create-checkout-session ───────────
// Creates Stripe checkout from user's cart

export const createCheckoutFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.productId",
      "name description imageUrl stock price discountedPrice currency isActive",
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const prod = item.productId;
      if (!prod || !prod.isActive) {
        return res
          .status(400)
          .json({
            message: `Product "${prod?.name || item.productId}" is no longer available`,
          });
      }
      if (item.quantity > prod.stock) {
        return res
          .status(400)
          .json({ message: `"${prod.name}" only has ${prod.stock} in stock` });
      }
    }

    // Build Stripe line items
    const lineItems = cart.items.map((item) => {
      const prod = item.productId;
      const unitPrice = item.price; // cart snapshot price
      return {
        price_data: {
          currency: prod.currency || "usd",
          product_data: {
            name: prod.name,
            description: prod.description?.slice(0, 100) || "",
            images: prod.imageUrl ? [prod.imageUrl] : [],
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: item.quantity,
      };
    });

    // Resolve coupon for Stripe
    let stripePromotionCodeId = null;
    let couponCode = null;
    if (cart.appliedCoupon?.code) {
      const coupon = await Coupon.findOne({
        code: cart.appliedCoupon.code,
        isActive: true,
      });
      if (coupon) {
        stripePromotionCodeId = coupon.stripePromotionCodeId;
        couponCode = coupon.code;
      }
    }

    // Serialize item IDs for webhook metadata
    const itemsMeta = cart.items.map((i) => ({
      productId: i.productId._id.toString(),
      quantity: i.quantity,
      size: i.size,
      color: i.color,
      price: i.price,
      name: i.productId.name,
      imageUrl: i.productId.imageUrl || "",
    }));

    const session = await createCheckoutSession({
      lineItems,
      userId: req.user._id.toString(),
      couponCode,
      stripePromotionCodeId,
      metadata: {
        cartId: cart._id.toString(),
        couponCode: couponCode || "",
        itemsJson: JSON.stringify(itemsMeta),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("createCheckoutFromCart error:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

// ── POST /api/payment/create-single-checkout ────────────
// Quick buy a single product (for AI clerk trigger)

export const createSingleProductCheckout = async (req, res) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (quantity > product.stock) {
      return res
        .status(400)
        .json({ message: `Only ${product.stock} in stock` });
    }

    const unitPrice = product.discountedPrice ?? product.price;

    const lineItems = [
      {
        price_data: {
          currency: product.currency || "usd",
          product_data: {
            name: product.name,
            description: product.description?.slice(0, 100) || "",
            images: product.imageUrl ? [product.imageUrl] : [],
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity,
      },
    ];

    const itemsMeta = [
      {
        productId: product._id.toString(),
        quantity,
        size: size || null,
        color: color || null,
        price: unitPrice,
        name: product.name,
        imageUrl: product.imageUrl || "",
      },
    ];

    const session = await createCheckoutSession({
      lineItems,
      userId: req.user._id.toString(),
      metadata: {
        itemsJson: JSON.stringify(itemsMeta),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("createSingleProductCheckout error:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

// ── POST /api/payment/webhook ───────────────────────────

export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error(`Webhook signature error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const userId = session.metadata.userId;
      const couponCode = session.metadata.couponCode || null;
      let items = [];

      try {
        items = JSON.parse(session.metadata.itemsJson || "[]");
      } catch {
        console.error("Failed to parse itemsJson from metadata");
      }

      // Calculate totals
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const totalPaid = (session.amount_total || 0) / 100;
      const discount = Math.round((subtotal - totalPaid) * 100) / 100;

      // Create order
      const order = new Order({
        userId,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          imageUrl: i.imageUrl,
        })),
        subtotal,
        discount: Math.max(0, discount),
        couponCode,
        total: totalPaid,
        currency: session.currency || "usd",
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        status: "paid",
      });

      await order.save();
      console.log("Order created:", order._id);

      // ── Inventory Update ──────────────────────────────
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        });
      }
      console.log("Inventory updated");

      // ── Record coupon usage ───────────────────────────
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode });
        if (coupon) {
          await coupon.recordUsage(userId);
          console.log("Coupon usage recorded:", couponCode);
        }
      }

      // ── Clear user's cart ─────────────────────────────
      if (session.metadata.cartId) {
        await Cart.findByIdAndUpdate(session.metadata.cartId, {
          items: [],
          appliedCoupon: { code: null, discountType: null, discountValue: 0 },
        });
        console.log("Cart cleared");
      }
    } catch (error) {
      console.error("Webhook fulfillment error:", error);
    }
  }

  res.json({ received: true });
};

// ── GET /api/payment/orders ─────────────────────────────

export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ── GET /api/payment/orders/:id ─────────────────────────

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

// ── GET /api/payment/orders/:id/tracking ──────────────────
// Get real-time tracking information for an order

export const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Generate tracking status based on order status
    const trackingInfo = generateTrackingInfo(order);
    
    res.json(trackingInfo);
  } catch (error) {
    console.error("getOrderTracking error:", error);
    res.status(500).json({ message: "Failed to fetch tracking information" });
  }
};

// ── GET /api/payment/track/:trackingNumber ─────────────────
// Track package by tracking number (public)

export const trackByNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const order = await Order.findOne({
      "tracking.trackingNumber": trackingNumber,
    }).lean();

    if (!order) {
      return res.status(404).json({ message: "Tracking number not found" });
    }

    // Generate tracking status based on order status
    const trackingInfo = generateTrackingInfo(order);
    
    // Return limited info for public tracking (no user details)
    res.json({
      trackingNumber: trackingInfo.trackingNumber,
      status: trackingInfo.status,
      statusText: trackingInfo.statusText,
      carrier: trackingInfo.carrier,
      estimatedDelivery: trackingInfo.estimatedDelivery,
      currentLocation: trackingInfo.currentLocation,
      progress: trackingInfo.progress,
      timeline: trackingInfo.timeline,
    });
  } catch (error) {
    console.error("trackByNumber error:", error);
    res.status(500).json({ message: "Failed to fetch tracking information" });
  }
};

// Helper function to generate tracking info based on order status
function generateTrackingInfo(order) {
  const statuses = ["pending", "paid", "processing", "shipped", "delivered"];
  const currentStatusIndex = statuses.indexOf(order.status);
  
  // Generate a consistent tracking number if not set
  const trackingNumber = order.tracking?.trackingNumber || 
    `SFX${order._id.toString().slice(-8).toUpperCase()}`;

  // Calculate estimated delivery (7 days from order creation by default)
  const orderDate = new Date(order.createdAt);
  const estimatedDelivery = order.tracking?.estimatedDelivery || 
    new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Generate timeline based on status
  const timeline = generateTimeline(order, orderDate);

  // Determine current location based on status
  let currentLocation = order.tracking?.currentLocation || "Processing Center";
  if (order.status === "shipped") {
    currentLocation = "In Transit";
  } else if (order.status === "delivered") {
    currentLocation = order.shippingAddress?.city || "Delivered";
  }

  // Calculate progress percentage
  const progress = Math.min(100, Math.max(0, ((currentStatusIndex + 1) / statuses.length) * 100));

  // Status text mapping
  const statusTextMap = {
    pending: "Order Placed",
    paid: "Payment Confirmed", 
    processing: "Preparing for Shipment",
    shipped: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  return {
    orderId: order._id,
    trackingNumber,
    status: order.status,
    statusText: statusTextMap[order.status] || order.status,
    carrier: order.tracking?.carrier || "softronix-express",
    estimatedDelivery,
    currentLocation,
    progress: Math.round(progress),
    timeline,
    shippingAddress: order.shippingAddress,
    items: order.items,
    lastUpdate: order.tracking?.lastUpdate || order.updatedAt,
  };
}

// Generate delivery timeline
function generateTimeline(order, orderDate) {
  const timeline = [];
  const statuses = ["pending", "paid", "processing", "shipped", "delivered"];
  const currentStatusIndex = statuses.indexOf(order.status);

  // Use tracking history if available, otherwise generate from status
  if (order.tracking?.history?.length > 0) {
    return order.tracking.history.map(h => ({
      status: h.status,
      location: h.location,
      description: h.description,
      timestamp: h.timestamp,
      completed: true,
    }));
  }

  // Generate timeline based on order status
  const stages = [
    { 
      status: "order_placed", 
      label: "Order Placed", 
      description: "Your order has been received",
      icon: "package"
    },
    { 
      status: "payment_confirmed", 
      label: "Payment Confirmed", 
      description: "Payment has been verified",
      icon: "credit-card"
    },
    { 
      status: "processing", 
      label: "Processing", 
      description: "Your order is being prepared",
      icon: "settings"
    },
    { 
      status: "shipped", 
      label: "Shipped", 
      description: "Package is on its way",
      icon: "truck"
    },
    { 
      status: "delivered", 
      label: "Delivered", 
      description: "Package has been delivered",
      icon: "check-circle"
    },
  ];

  stages.forEach((stage, index) => {
    let completed = false;
    let timestamp = null;
    let isCurrent = false;

    // Determine completion status
    if (index <= currentStatusIndex) {
      completed = true;
      // Generate realistic timestamps
      const hoursOffset = index * 12; // 12 hours between each stage
      timestamp = new Date(orderDate.getTime() + hoursOffset * 60 * 60 * 1000);
    }

    if (index === currentStatusIndex) {
      isCurrent = true;
      timestamp = new Date(order.updatedAt);
    }

    timeline.push({
      ...stage,
      completed,
      isCurrent,
      timestamp,
    });
  });

  return timeline;
}
