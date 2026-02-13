const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const mongoose = require("mongoose");

// Constants for cart expiration
const CART_EXPIRATION_DAYS = 30; // Number of days before a cart is considered abandoned

// Create a function to clean up abandoned carts
const cleanupAbandonedCarts = async () => {
  try {
    console.log("Running abandoned cart cleanup job");

    // Make sure MongoDB is connected before attempting cleanup
    if (mongoose.connection.readyState !== 1) {
      console.log("MongoDB not connected, skipping abandoned cart cleanup");
      return;
    }

    // Calculate the date threshold (e.g., 30 days ago)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - CART_EXPIRATION_DAYS);

    // Find all carts that haven't been updated in the threshold period
    const result = await Cart.deleteMany({
      updatedAt: { $lt: expirationDate },
    });

    console.log(`Deleted ${result.deletedCount} abandoned carts`);
  } catch (error) {
    console.error("Error cleaning up abandoned carts:", error);
  }
};

// Schedule cleanup job to run daily, but only after MongoDB is connected
const scheduleCartCleanup = () => {
  // Only schedule if MongoDB is connected
  if (mongoose.connection.readyState === 1) {
    console.log("Scheduling abandoned cart cleanup job");

    // Run cleanup immediately
    cleanupAbandonedCarts();

    // Then schedule it to run daily (24 hours = 86,400,000 ms)
    setInterval(cleanupAbandonedCarts, 86400000);
  } else {
    console.log("MongoDB not connected, skipping cart cleanup scheduler");
  }
};

// Start the cleanup scheduler only after MongoDB is connected
mongoose.connection.once("connected", () => {
  console.log("MongoDB connected, scheduling cart cleanup...");
  setTimeout(scheduleCartCleanup, 5000); // Wait 5 seconds after connection
});

// Get cart items
const getCart = async (req, res) => {
  try {
    console.log("GET /cart - User:", req.user?.id);

    // For unauthenticated users, return empty cart
    if (!req.user || !req.user.id) {
      return res.status(200).json([]);
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      console.log("Creating new cart for user:", req.user.id);
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }

    console.log("Cart found with items:", cart.items.length);
    res.json(cart.items);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get cart details including applied coupon
const getCartDetails = async (req, res) => {
  try {
    console.log("GET /cart/details - User:", req.user?.id);

    // For unauthenticated users, return empty cart
    if (!req.user || !req.user.id) {
      return res.status(200).json({ items: [], appliedCoupon: null });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      console.log("Creating new cart for user:", req.user.id);
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }

    // Calculate cart totals
    const subtotal = cart.items.reduce((total, item) => {
      const price = item.product.discountedPrice || item.product.price;
      return total + price * item.quantity;
    }, 0);

    // If there's a coupon applied, verify it's still valid
    if (cart.appliedCoupon && cart.appliedCoupon.couponId) {
      try {
        const coupon = await Coupon.findById(cart.appliedCoupon.couponId);

        // If coupon no longer exists or is invalid, remove it from the cart
        if (!coupon || !coupon.isValid(req.user.id, subtotal)) {
          cart.appliedCoupon = undefined;
          await cart.save();
        }
      } catch (couponError) {
        console.error("Error verifying coupon:", couponError);
        // Continue without removing the coupon to avoid disrupting the user experience
      }
    }

    console.log("Cart found with items:", cart.items.length);
    res.json({
      items: cart.items,
      appliedCoupon: cart.appliedCoupon || null,
      subtotal,
    });
  } catch (error) {
    console.error("Error fetching cart details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    console.log("POST /cart - User:", req.user?.id, "Body:", req.body);

    // For unauthenticated users, just return success
    // The client will handle storing the cart in localStorage
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        message: "Item added to local cart",
        item: req.body,
        success: true,
      });
    }

    const { productId, quantity, size, color } = req.body;

    // Validate request
    if (!productId || !quantity || !size || !color) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate quantity
    if (typeof quantity !== "number" || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be a positive number" });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      console.log("Creating new cart for user:", req.user.id);
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Check if product exists - handle both ObjectId and string IDs
    let product;
    try {
      // First try to find by _id (ObjectId)
      product = await Product.findById(productId);
    } catch (err) {
      // If that fails, try to find by id (string)
      product = await Product.findOne({ id: productId });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check inventory availability
    if (!product.inStock) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    // Validate size availability
    if (!product.sizes.includes(size)) {
      return res
        .status(400)
        .json({ message: "Selected size is not available for this product" });
    }

    // Validate color availability
    if (!product.colors.includes(color)) {
      return res
        .status(400)
        .json({ message: "Selected color is not available for this product" });
    }

    // Check inventory quantity (if inventory tracking is enabled for this product)
    if (product.inventory !== undefined && product.inventory < quantity) {
      return res.status(400).json({
        message: "Not enough inventory available",
        availableQuantity: product.inventory,
      });
    }

    // Check if product already exists with same size and color
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      // Check inventory again with the new total quantity
      if (product.inventory !== undefined && product.inventory < newQuantity) {
        return res.status(400).json({
          message: "Not enough inventory available for requested quantity",
          availableQuantity: product.inventory,
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      console.log("Updated existing cart item quantity");
    } else {
      // Create product summary for cart
      const productSummary = {
        id: product.id || product._id.toString(),
        name: product.name,
        price: product.price,
        discountedPrice: product.discountedPrice,
        images: product.images,
      };

      // Add new item using the model method
      cart.addItem({
        productId,
        quantity,
        size,
        color,
        product: productSummary,
      });
      console.log("Added new item to cart");
    }

    // Save cart
    await cart.save();
    console.log("Cart saved with items:", cart.items.length);

    // Return updated cart items
    res.status(201).json(cart.items);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update cart item
const updateCartItem = async (req, res) => {
  try {
    console.log(
      "PUT /cart/:itemId - User:",
      req.user?.id,
      "Params:",
      req.params,
      "Body:",
      req.body
    );

    // For unauthenticated users, return success (client will handle local storage)
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        message: "Item updated in local cart",
        success: true,
        item: req.body,
      });
    }

    const { itemId } = req.params;
    const { quantity, size, color } = req.body;

    // Validate request
    if (!quantity && !size && !color) {
      return res.status(400).json({
        message: "At least one of quantity, size, or color must be provided",
      });
    }

    // Validate quantity if provided
    if (quantity && (typeof quantity !== "number" || quantity <= 0)) {
      return res
        .status(400)
        .json({ message: "Quantity must be a positive number" });
    }

    // Find cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item in cart
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // If changing size or color, need to check inventory
    if (size || color) {
      // Get the product for validation of size/color and inventory
      const product = await Product.findOne({ id: item.productId });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Validate new size if provided
      if (size && !product.sizes.includes(size)) {
        return res
          .status(400)
          .json({ message: "Selected size is not available for this product" });
      }

      // Validate new color if provided
      if (color && !product.colors.includes(color)) {
        return res.status(400).json({
          message: "Selected color is not available for this product",
        });
      }
    }

    // Update item
    if (quantity) item.quantity = quantity;
    if (size) item.size = size;
    if (color) item.color = color;

    // Save cart
    await cart.save();
    console.log("Cart updated with items:", cart.items.length);

    // Return updated cart items
    res.json(cart.items);
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    console.log(
      "DELETE /cart/:itemId - User:",
      req.user?.id,
      "Params:",
      req.params
    );

    // For unauthenticated users, return success (client will handle local storage)
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        message: "Item removed from local cart",
        success: true,
        itemId: req.params.itemId,
      });
    }

    const { itemId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex((item) => item._id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Remove item from cart
    cart.items.splice(itemIndex, 1);

    // Save cart
    await cart.save();
    console.log("Item removed from cart, items remaining:", cart.items.length);

    // Return updated cart items
    res.json(cart.items);
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    console.log("DELETE /cart - User:", req.user?.id);

    // For unauthenticated users, return success (client will handle local storage)
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        message: "Local cart cleared",
        success: true,
      });
    }

    // Find cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Clear items and applied coupon
    cart.items = [];
    cart.appliedCoupon = undefined;

    // Save cart
    await cart.save();
    console.log("Cart cleared with coupon reset");

    // Return empty cart items
    res.json(cart.items);
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check inventory
const checkInventory = async (req, res) => {
  try {
    console.log("GET /check-inventory - Query:", req.query);

    const { productId, size, color, quantity } = req.query;

    // Validate request
    if (!productId || !size || !color) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find product
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is in stock
    if (!product.inStock) {
      return res.json({
        available: false,
        message: "Product is out of stock",
      });
    }

    // Check if size is available
    if (!product.sizes.includes(size)) {
      return res.json({
        available: false,
        message: "Selected size is not available",
      });
    }

    // Check if color is available
    if (!product.colors.includes(color)) {
      return res.json({
        available: false,
        message: "Selected color is not available",
      });
    }

    // Check inventory quantity if provided
    if (product.inventory !== undefined && quantity) {
      const numQuantity = parseInt(quantity, 10);
      if (product.inventory < numQuantity) {
        return res.json({
          available: true,
          availableQuantity: product.inventory,
          message: `Only ${product.inventory} units available`,
        });
      }
    }

    // All checks passed
    return res.json({
      available: true,
      availableQuantity: product.inventory,
      message: "Product is available",
    });
  } catch (error) {
    console.error("Error checking inventory:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Sync local cart with server
const syncCart = async (req, res) => {
  try {
    console.log("POST /cart/sync - User:", req.user?.id);

    // For unauthenticated users, return success (client will handle local storage)
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        message: "Cannot sync without authentication",
        success: false,
      });
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid items format" });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      console.log("Creating new cart for user:", req.user.id);
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Process each item from local storage
    for (const item of items) {
      // Skip if missing required fields
      if (!item.productId || !item.quantity || !item.size || !item.color) {
        console.log("Skipping invalid item:", item);
        continue;
      }

      // Check if product exists
      let product;
      try {
        product = await Product.findById(item.productId);
      } catch (err) {
        product = await Product.findOne({ id: item.productId });
      }

      if (!product) {
        console.log("Product not found:", item.productId);
        continue;
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (cartItem) =>
          cartItem.productId === (product.id || product._id.toString()) &&
          cartItem.size === item.size &&
          cartItem.color === item.color
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        cart.items[existingItemIndex].quantity += item.quantity;
      } else {
        // Create product summary
        const productSummary = {
          id: product.id || product._id.toString(),
          name: product.name,
          price: product.price,
          discountedPrice: product.discountedPrice,
          images: product.images,
        };

        // Add new item
        cart.addItem({
          productId: product.id || product._id.toString(),
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          product: productSummary,
        });
      }
    }

    // Save cart
    await cart.save();
    console.log("Cart synced with items:", cart.items.length);

    // Return updated cart items
    res.status(200).json(cart.items);
  } catch (error) {
    console.error("Error syncing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getCart,
  getCartDetails,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkInventory,
  syncCart,
};
