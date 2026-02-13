import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ── Helpers ────────────────────────────────────────────

function formatCart(cart) {
  return {
    _id: cart._id,
    items: cart.items,
    appliedCoupon: cart.appliedCoupon,
    subtotal: cart.subtotal,
    discount: cart.discount,
    total: cart.total,
  };
}

// ── GET /api/cart ────────────────────────────────────────

export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.productId",
      "name imageUrl stock inStock attributes",
    );

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    res.json(formatCart(cart));
  } catch (error) {
    console.error("getCart error:", error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
};

// ── POST /api/cart/add ──────────────────────────────────

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    // Validate product exists and is in stock
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ message: `Only ${product.stock} items in stock` });
    }

    // Validate selected size/color exist on product
    if (size && product.attributes.sizes.length > 0) {
      if (!product.attributes.sizes.includes(size)) {
        return res.status(400).json({
          message: `Size "${size}" not available. Options: ${product.attributes.sizes.join(", ")}`,
        });
      }
    }
    if (color && product.attributes.colors.length > 0) {
      if (!product.attributes.colors.includes(color)) {
        return res.status(400).json({
          message: `Color "${color}" not available. Options: ${product.attributes.colors.join(", ")}`,
        });
      }
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    // Check if same product+size+color is already in cart
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.size === (size || null) &&
        item.color === (color || null),
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > product.stock) {
        return res
          .status(400)
          .json({ message: `Only ${product.stock} items in stock` });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      const effectivePrice = product.discountedPrice ?? product.price;
      cart.items.push({
        productId,
        quantity: Number(quantity),
        size: size || null,
        color: color || null,
        price: effectivePrice,
      });
    }

    await cart.save();
    res.json(formatCart(cart));
  } catch (error) {
    console.error("addToCart error:", error);
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

// ── PUT /api/cart/update ────────────────────────────────

export const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (!itemId || quantity === undefined) {
      return res
        .status(400)
        .json({ message: "itemId and quantity are required" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (Number(quantity) <= 0) {
      cart.items.pull({ _id: itemId });
    } else {
      // Validate stock
      const product = await Product.findById(item.productId);
      if (product && Number(quantity) > product.stock) {
        return res
          .status(400)
          .json({ message: `Only ${product.stock} items in stock` });
      }
      item.quantity = Number(quantity);
    }

    await cart.save();
    res.json(formatCart(cart));
  } catch (error) {
    console.error("updateCartItem error:", error);
    res.status(500).json({ message: "Failed to update cart" });
  }
};

// ── DELETE /api/cart/remove/:itemId ─────────────────────

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items.pull({ _id: itemId });
    await cart.save();
    res.json(formatCart(cart));
  } catch (error) {
    console.error("removeFromCart error:", error);
    res.status(500).json({ message: "Failed to remove item" });
  }
};

// ── DELETE /api/cart/clear ──────────────────────────────

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    cart.appliedCoupon = { code: null, discountType: null, discountValue: 0 };
    await cart.save();
    res.json(formatCart(cart));
  } catch (error) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
};

// ── POST /api/cart/sync ─────────────────────────────────
// Merge local-storage cart into server cart (called on login)

export const syncCart = async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantity, size, color }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items array required" });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    for (const incoming of items) {
      const product = await Product.findById(incoming.productId);
      if (!product || !product.isActive) continue;

      const existingIndex = cart.items.findIndex(
        (item) =>
          item.productId.toString() === incoming.productId &&
          item.size === (incoming.size || null) &&
          item.color === (incoming.color || null),
      );

      const effectivePrice = product.discountedPrice ?? product.price;
      const qty = Math.min(Number(incoming.quantity) || 1, product.stock);

      if (existingIndex > -1) {
        const newQty = Math.min(
          cart.items[existingIndex].quantity + qty,
          product.stock,
        );
        cart.items[existingIndex].quantity = newQty;
        cart.items[existingIndex].price = effectivePrice;
      } else {
        cart.items.push({
          productId: incoming.productId,
          quantity: qty,
          size: incoming.size || null,
          color: incoming.color || null,
          price: effectivePrice,
        });
      }
    }

    await cart.save();
    res.json(formatCart(cart));
  } catch (error) {
    console.error("syncCart error:", error);
    res.status(500).json({ message: "Failed to sync cart" });
  }
};
