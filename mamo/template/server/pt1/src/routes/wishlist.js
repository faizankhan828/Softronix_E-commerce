"use strict";
const express = require("express");
const {
  optionalAuthenticateToken,
  authenticateToken,
  verifyCsrfToken,
  rateLimit,
} = require("../middleware/auth");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

const router = express.Router();

// Apply CSRF protection to all routes except GET requests
router.use(verifyCsrfToken);

// Apply rate limiting to wishlist operations
const wishlistRateLimit = rateLimit(20, 1 * 60 * 1000); // 20 attempts per minute

// Get user's wishlist
router.get("/", optionalAuthenticateToken, async (req, res) => {
  try {
    // For unauthenticated users, return empty array
    if (!req.user || !req.user.id) {
      return res.status(200).json([]);
    }

    // Find or create wishlist for user
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.id, items: [] });
      await wishlist.save();
    }

    res.json(wishlist.items);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add product to wishlist
router.post(
  "/",
  optionalAuthenticateToken,
  wishlistRateLimit,
  async (req, res) => {
    try {
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      // For unauthenticated users, return success (client will handle local storage)
      if (!req.user || !req.user.id) {
        return res.status(200).json({
          message: "Item added to local wishlist",
          success: true,
          productId,
        });
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

      // Find or create wishlist
      let wishlist = await Wishlist.findOne({ userId: req.user.id });
      if (!wishlist) {
        wishlist = new Wishlist({ userId: req.user.id, items: [] });
      }

      // Check if product is already in wishlist
      const existingItem = wishlist.items.find(
        (item) => item.productId.toString() === productId
      );
      if (existingItem) {
        return res.status(400).json({ message: "Product already in wishlist" });
      }

      // Create product summary for wishlist
      const productSummary = {
        id: product.id || product._id.toString(),
        name: product.name,
        price: product.price,
        discountedPrice: product.discountedPrice,
        images: product.images || [],
      };

      // Ensure image URLs are complete
      if (productSummary.images && productSummary.images.length > 0) {
        console.log(
          "Raw image paths before processing:",
          productSummary.images
        );

        // Process each image to ensure it has a complete URL
        productSummary.images = productSummary.images.map((img) => {
          // If image already starts with http or https, it's already a complete URL
          if (
            img &&
            (img.startsWith("http://") || img.startsWith("https://"))
          ) {
            return img;
          }

          // If it's a relative path, convert to absolute URL
          // This assumes image paths in DB might be stored without the domain
          // Adjust the base URL according to your environment configuration
          const baseUrl = process.env.BASE_URL || "https://serverk-ochre.vercel.app";
          return img ? `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}` : "";
        });

        console.log("Processed image URLs:", productSummary.images);
      } else {
        console.log(
          "No images found for product:",
          product.id || product._id.toString()
        );
      }

      console.log(
        "Adding product to wishlist with images:",
        productSummary.images
      );

      // Add to wishlist
      wishlist.items.push({
        productId: product.id || product._id.toString(), // Use string ID consistently
        product: productSummary,
        addedAt: new Date(),
      });

      await wishlist.save();
      res.status(201).json(wishlist.items);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Remove item from wishlist
router.delete(
  "/:productId",
  optionalAuthenticateToken,
  wishlistRateLimit,
  async (req, res) => {
    try {
      const { productId } = req.params;

      // For unauthenticated users, return success (client will handle local storage)
      if (!req.user || !req.user.id) {
        return res.status(200).json({
          message: "Item removed from local wishlist",
          success: true,
          productId,
        });
      }

      const wishlist = await Wishlist.findOne({ userId: req.user.id });
      if (!wishlist) {
        return res.status(404).json({ message: "Wishlist not found" });
      }

      // Check if the productId is an item _id or a product ID
      const isItemId = wishlist.items.some((item) => item._id === productId);

      // Remove item based on the appropriate field
      const result = await Wishlist.updateOne(
        { userId: req.user.id },
        isItemId
          ? { $pull: { items: { _id: productId } } }
          : { $pull: { items: { productId } } }
      );

      if (result.modifiedCount === 0) {
        return res
          .status(404)
          .json({ message: "Product not found in wishlist" });
      }

      // Get updated wishlist
      const updatedWishlist = await Wishlist.findOne({ userId: req.user.id });
      res.json(updatedWishlist.items);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Clear wishlist
router.delete(
  "/",
  optionalAuthenticateToken,
  wishlistRateLimit,
  async (req, res) => {
    try {
      // For unauthenticated users, return success (client will handle local storage)
      if (!req.user || !req.user.id) {
        return res.status(200).json({
          message: "Local wishlist cleared",
          success: true,
        });
      }

      const result = await Wishlist.updateOne(
        { userId: req.user.id },
        { $set: { items: [] } }
      );

      if (result.matchedCount === 0) {
        // Create empty wishlist if none exists
        const wishlist = new Wishlist({ userId: req.user.id, items: [] });
        await wishlist.save();
      }

      res.json({ message: "Wishlist cleared successfully" });
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Sync local wishlist with server
router.post("/sync", authenticateToken, wishlistRateLimit, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid items format" });
    }

    // For unauthenticated users, return error message
    if (!req.user || !req.user.id) {
      return res.status(200).json({
        message: "Cannot sync without authentication",
        success: false,
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.id, items: [] });
    }

    // Process each item from local storage
    for (const item of items) {
      // Skip if already in wishlist
      const existingItem = wishlist.items.find(
        (wItem) => wItem.productId === item.productId
      );

      if (!existingItem) {
        // Fetch product details to ensure we have valid data
        let product;
        try {
          product = await Product.findById(item.productId);
        } catch (err) {
          product = await Product.findOne({ id: item.productId });
        }

        if (product) {
          // Create product summary
          const productSummary = {
            id: product.id || product._id.toString(),
            name: product.name,
            price: product.price,
            discountedPrice: product.discountedPrice,
            images: product.images || [],
          };

          // Ensure image URLs are complete
          if (productSummary.images && productSummary.images.length > 0) {
            console.log(
              "Sync - Raw image paths before processing:",
              productSummary.images
            );

            // Process each image to ensure it has a complete URL
            productSummary.images = productSummary.images.map((img) => {
              // If image already starts with http or https, it's already a complete URL
              if (
                img &&
                (img.startsWith("http://") || img.startsWith("https://"))
              ) {
                return img;
              }

              // If it's a relative path, convert to absolute URL
              // This assumes image paths in DB might be stored without the domain
              const baseUrl = process.env.BASE_URL || "https://serverk-ochre.vercel.app";
              return img
                ? `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`
                : "";
            });

            console.log("Sync - Processed image URLs:", productSummary.images);
          }

          // Add to wishlist
          wishlist.items.push({
            productId: product.id || product._id.toString(),
            product: productSummary,
            addedAt: new Date(),
          });
        }
      }
    }

    // Save updated wishlist
    await wishlist.save();

    res.status(200).json(wishlist.items);
  } catch (error) {
    console.error("Error syncing wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
