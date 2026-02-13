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
