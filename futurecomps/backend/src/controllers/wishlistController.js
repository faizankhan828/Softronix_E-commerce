import User from "../models/User.js";
import Product from "../models/Product.js";

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format response to match frontend expectation (WishlistItem interface)
    // The frontend expects { productId, product: { ... } }
    // But since we just store IDs in User.wishlist, we need to map it
    const wishlistItems = user.wishlist.map((product) => ({
      _id: product._id, // This acts as the item ID for removal if needed, or we use productId
      productId: product._id,
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        discountedPrice: product.discountedPrice,
        images: product.images,
      },
    }));

    res.json(wishlistItems);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Server error fetching wishlist" });
  }
};

// Add to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Add to user's wishlist if not already there
    // Use $addToSet to avoid duplicates
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: productId },
    });

    res.status(200).json({ message: "Product added to wishlist" });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Server error adding to wishlist" });
  }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    // The route is /:itemId, but here itemId represents the productId since we store direct references
    const { itemId } = req.params;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $pull: { wishlist: itemId },
    });

    res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Server error removing from wishlist" });
  }
};

// Clear wishlist
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $set: { wishlist: [] },
    });

    res.status(200).json({ message: "Wishlist cleared" });
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    res.status(500).json({ message: "Server error clearing wishlist" });
  }
};

// Sync wishlist after login
export const syncWishlist = async (req, res) => {
  try {
    const { items } = req.body; // Expecting array of local wishlist items
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(200).json({ message: "No items to sync" });
    }

    // Extract productIds from local items
    const productIds = items.map((item) => item.productId);

    // Add all to user's wishlist
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: { $each: productIds } },
    });

    // Return updated wishlist
    await getWishlist(req, res);
  } catch (error) {
    console.error("Error syncing wishlist:", error);
    res.status(500).json({ message: "Server error syncing wishlist" });
  }
};
