import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import { validateDiscount } from "../services/negotiationService.js";
import { v4 as uuidv4 } from "uuid";
import { createStripeCoupon } from "../services/stripeService.js";

// ── POST /api/clerk/search ──────────────────────────────
// Semantic-ish search for the frontend AI to use
// Returns products with full data (including hidden fields for AI context)

export const searchProducts = async (req, res) => {
  try {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      colors,
      sizes,
      occasion,
      vibe,
      tags,
      limit = 10,
      inStockOnly = true,
    } = req.body;

    const filter = { isActive: true };

    if (inStockOnly) {
      filter.stock = { $gt: 0 };
    }

    if (query) {
      filter.$text = { $search: query };
    }

    if (category) {
      filter.category = { $regex: new RegExp(category, "i") };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (colors && colors.length > 0) {
      filter["attributes.colors"] = {
        $in: colors.map((c) => new RegExp(c, "i")),
      };
    }

    if (sizes && sizes.length > 0) {
      filter["attributes.sizes"] = {
        $in: sizes.map((s) => s.trim()),
      };
    }

    if (occasion && occasion.length > 0) {
      filter.occasion = {
        $in: occasion.map((o) => o.trim().toLowerCase()),
      };
    }

    if (vibe && vibe.length > 0) {
      filter.vibe = {
        $in: vibe.map((v) => v.trim().toLowerCase()),
      };
    }

    if (tags && tags.length > 0) {
      filter.tags = {
        $in: tags.map((t) => t.trim().toLowerCase()),
      };
    }

    let sortOption = { createdAt: -1 };
    if (query) {
      sortOption = { score: { $meta: "textScore" }, ...sortOption };
    }

    // For the AI context, include hiddenBottomPrice and negotiationEnabled
    // The frontend AI needs these to handle negotiation properly
    const products = await Product.find(filter)
      .sort(sortOption)
      .limit(Number(limit))
      .lean();

    // Build context-ready product data
    const results = products.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      discountedPrice: p.discountedPrice,
      category: p.category,
      attributes: p.attributes,
      imageUrl: p.imageUrl,
      images: p.images,
      rating: p.rating,
      reviewCount: p.reviewCount,
      stock: p.stock,
      inStock: p.inStock,
      tags: p.tags,
      occasion: p.occasion,
      vibe: p.vibe,
      isFeatured: p.isFeatured,
      isNew: p.isNew,
      // AI-only fields — frontend should NOT display these to user
      hiddenBottomPrice: p.hiddenBottomPrice,
      negotiationEnabled: p.negotiationEnabled,
    }));

    res.json({ products: results, total: results.length });
  } catch (error) {
    console.error("clerk searchProducts error:", error);
    res.status(500).json({ message: "Search failed" });
  }
};

// ── POST /api/clerk/inventory-check ─────────────────────
// Check stock/availability for specific product(s)

export const inventoryCheck = async (req, res) => {
  try {
    const { productId, productIds } = req.body;

    // Single product check
    if (productId) {
      const product = await Product.findById(productId)
        .select("name price discountedPrice stock inStock attributes category")
        .lean();

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.json({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          discountedPrice: product.discountedPrice,
          stock: product.stock,
          inStock: product.inStock,
          availableColors: product.attributes?.colors || [],
          availableSizes: product.attributes?.sizes || [],
        },
      });
    }

    // Bulk check
    if (productIds && Array.isArray(productIds)) {
      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true,
      })
        .select("name price discountedPrice stock inStock attributes")
        .lean();

      return res.json({
        products: products.map((p) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          discountedPrice: p.discountedPrice,
          stock: p.stock,
          inStock: p.inStock,
          availableColors: p.attributes?.colors || [],
          availableSizes: p.attributes?.sizes || [],
        })),
      });
    }

    return res
      .status(400)
      .json({ message: "productId or productIds required" });
  } catch (error) {
    console.error("inventoryCheck error:", error);
    res.status(500).json({ message: "Inventory check failed" });
  }
};

// ── GET /api/clerk/recommendations ──────────────────────
// Get personalized recommendations based on user's purchase history

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Number(req.query.limit) || 8;

    // Get user's past orders
    const orders = await Order.find({ userId, status: "paid" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Extract categories, tags, vibes from purchased products
    const purchasedProductIds = new Set();
    const categorySet = new Set();
    const tagSet = new Set();

    for (const order of orders) {
      for (const item of order.items) {
        purchasedProductIds.add(item.productId.toString());
      }
    }

    // Get full product data for purchased items
    if (purchasedProductIds.size > 0) {
      const purchasedProducts = await Product.find({
        _id: { $in: [...purchasedProductIds] },
      })
        .select("category tags vibe occasion")
        .lean();

      for (const p of purchasedProducts) {
        if (p.category) categorySet.add(p.category);
        if (p.tags) p.tags.forEach((t) => tagSet.add(t));
      }
    }

    // Build recommendation query — products in similar categories/tags
    // but NOT already purchased
    let filter = {
      isActive: true,
      stock: { $gt: 0 },
    };

    if (purchasedProductIds.size > 0) {
      filter._id = { $nin: [...purchasedProductIds] };
    }

    // If we have purchase history, prefer similar categories/tags
    if (categorySet.size > 0 || tagSet.size > 0) {
      const orConditions = [];
      if (categorySet.size > 0)
        orConditions.push({ category: { $in: [...categorySet] } });
      if (tagSet.size > 0) orConditions.push({ tags: { $in: [...tagSet] } });
      if (orConditions.length > 0) {
        filter.$or = orConditions;
      }
    }

    let products = await Product.find(filter)
      .select("-hiddenBottomPrice -negotiationEnabled")
      .sort({ isFeatured: -1, rating: -1 })
      .limit(limit)
      .lean();

    // If we don't have enough, fill with popular/featured products
    if (products.length < limit) {
      const existingIds = products.map((p) => p._id);
      const fallback = await Product.find({
        isActive: true,
        stock: { $gt: 0 },
        _id: { $nin: [...purchasedProductIds, ...existingIds] },
      })
        .select("-hiddenBottomPrice -negotiationEnabled")
        .sort({ isFeatured: -1, rating: -1, reviewCount: -1 })
        .limit(limit - products.length)
        .lean();
      products = [...products, ...fallback];
    }

    res.json({
      products,
      basedOnPurchases: purchasedProductIds.size > 0,
      categoriesMatched: [...categorySet],
    });
  } catch (error) {
    console.error("getRecommendations error:", error);
    res.status(500).json({ message: "Failed to get recommendations" });
  }
};

// ── POST /api/clerk/generate-coupon ─────────────────────
// Frontend AI calls this when negotiation succeeds
// Creates a coupon, syncs to Stripe, returns the code

export const generateCoupon = async (req, res) => {
  try {
    const { productId, discountType, discountValue, reason } = req.body;

    if (!productId || !discountType || discountValue === undefined) {
      return res.status(400).json({
        message: "productId, discountType, and discountValue are required",
      });
    }

    // Validate the product and discount
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const validation = validateDiscount(product, discountType, discountValue);
    if (!validation.allowed) {
      return res.status(400).json({
        message: validation.reason,
        maxDiscount: validation.maxDiscount,
        maxPercentage: validation.maxPercentage,
      });
    }

    // Generate unique coupon code
    const shortId = uuidv4().slice(0, 6).toUpperCase();
    const prefix = reason?.toLowerCase().includes("birthday")
      ? "BDAY"
      : reason?.toLowerCase().includes("bulk")
        ? "BULK"
        : "DEAL";
    const code = `${prefix}-${shortId}`;

    // Create coupon in DB
    const coupon = new Coupon({
      code,
      discountType,
      discountValue,
      minPurchase: 0,
      maxDiscount: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      usageLimit: 1,
      onePerUser: true,
      source: "negotiation",
      negotiationMeta: {
        userId: req.user._id,
        productId: product._id,
        reason: reason || "Negotiated discount",
      },
      createdBy: null,
    });

    await coupon.save();

    // Sync to Stripe
    const stripeResult = await createStripeCoupon(coupon);
    coupon.stripeCouponId = stripeResult.stripeCouponId;
    coupon.stripePromotionCodeId = stripeResult.stripePromotionCodeId;
    await coupon.save();

    // Calculate effective price
    const currentPrice = product.discountedPrice ?? product.price;
    let discountAmount;
    if (discountType === "percentage") {
      discountAmount =
        Math.round(currentPrice * (discountValue / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(discountValue, currentPrice);
    }
    const effectivePrice =
      Math.round((currentPrice - discountAmount) * 100) / 100;

    res.status(201).json({
      couponCode: code,
      discountType,
      discountValue,
      discountAmount,
      originalPrice: currentPrice,
      effectivePrice,
      expiresAt: coupon.expiresAt,
      message: `Coupon ${code} created! Apply it to your cart.`,
    });
  } catch (error) {
    console.error("generateCoupon error:", error);
    res.status(500).json({ message: "Failed to generate coupon" });
  }
};

// ── GET /api/clerk/user-context ─────────────────────────
// Returns user's cart + purchase history for the frontend AI context

export const getUserContext = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get cart
    const cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "name price imageUrl stock attributes",
    );

    const cartData = cart
      ? {
          items: cart.items.map((i) => ({
            itemId: i._id,
            productId: i.productId?._id,
            name: i.productId?.name || "Unknown",
            price: i.price,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            stock: i.productId?.stock,
          })),
          appliedCoupon: cart.appliedCoupon,
          subtotal: cart.subtotal,
          discount: cart.discount,
          total: cart.total,
        }
      : { items: [], subtotal: 0, discount: 0, total: 0, appliedCoupon: null };

    // Get recent orders
    const orders = await Order.find({ userId, status: "paid" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("items total createdAt couponCode")
      .lean();

    const purchaseHistory = orders.map((o) => ({
      orderId: o._id,
      items: o.items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total: o.total,
      date: o.createdAt,
      couponUsed: o.couponCode,
    }));

    res.json({
      cart: cartData,
      purchaseHistory,
      userName: req.user.name,
    });
  } catch (error) {
    console.error("getUserContext error:", error);
    res.status(500).json({ message: "Failed to get user context" });
  }
};
