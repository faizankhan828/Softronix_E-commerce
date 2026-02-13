const HomepageSettings = require("../models/HomepageSettings");
const Product = require("../models/Product");

// Get homepage settings (public)
const getHomepageSettings = async (req, res) => {
  try {
    const settings = await HomepageSettings.getSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching homepage settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get carousel items with product details (public)
const getCarouselItems = async (req, res) => {
  try {
    const settings = await HomepageSettings.getSettings();
    const carouselItems = settings.carousel.items || [];

    // Return empty array if no carousel items
    if (carouselItems.length === 0) {
      return res.json([]);
    }

    // Sort by display order
    carouselItems.sort((a, b) => a.displayOrder - b.displayOrder);

    // Ensure each item has proper display values
    const enhancedItems = await Promise.all(
      carouselItems.map(async (item) => {
        // If the item is missing critical display values, try to fetch product data
        if (
          !item.model ||
          !item.collection ||
          item.model.includes("undefined")
        ) {
          try {
            const product = await Product.findOne({ id: item.productId });
            if (product) {
              // Update missing fields
              if (!item.model || item.model.includes("undefined")) {
                item.model = `MODEL.${item.productId.substring(0, 2)}`;
              }
              if (!item.collection) {
                item.collection = product.category || "COLLECTION";
              }
              if (!item.material) {
                item.material = "Premium Material";
              }
              if (!item.subTitle) {
                item.subTitle = product.category || "COLLECTION";
              }
              if (!item.description) {
                item.description = product.description || "";
              }
            }
          } catch (err) {
            console.error(
              `Error enhancing carousel item ${item.productId}:`,
              err
            );
          }
        }
        return item;
      })
    );

    res.json(enhancedItems);
  } catch (error) {
    console.error("Error fetching carousel items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update homepage settings (admin only)
const updateHomepageSettings = async (req, res) => {
  try {
    const updates = req.body;

    // Get current settings
    let settings = await HomepageSettings.getSettings();

    // Update fields if provided
    if (updates.carousel) {
      if (updates.carousel.items) {
        settings.carousel.items = updates.carousel.items;
      }
      if (updates.carousel.autoplay !== undefined) {
        settings.carousel.autoplay = updates.carousel.autoplay;
      }
      if (updates.carousel.autoplaySpeed !== undefined) {
        settings.carousel.autoplaySpeed = updates.carousel.autoplaySpeed;
      }
    }

    if (updates.featuredCategories) {
      settings.featuredCategories = updates.featuredCategories;
    }

    if (updates.newArrivalsCount !== undefined) {
      settings.newArrivalsCount = updates.newArrivalsCount;
    }

    if (updates.sustainableFashion) {
      if (updates.sustainableFashion.title) {
        settings.sustainableFashion.title = updates.sustainableFashion.title;
      }
      if (updates.sustainableFashion.description) {
        settings.sustainableFashion.description =
          updates.sustainableFashion.description;
      }
      if (updates.sustainableFashion.features) {
        settings.sustainableFashion.features =
          updates.sustainableFashion.features;
      }
      if (updates.sustainableFashion.image) {
        settings.sustainableFashion.image = updates.sustainableFashion.image;
      }
    }

    if (updates.shopBenefits && updates.shopBenefits.items) {
      settings.shopBenefits.items = updates.shopBenefits.items;
    }

    if (updates.newsletter) {
      if (updates.newsletter.title) {
        settings.newsletter.title = updates.newsletter.title;
      }
      if (updates.newsletter.description) {
        settings.newsletter.description = updates.newsletter.description;
      }
    }

    // Save updated settings
    await settings.save();

    res.json(settings);
  } catch (error) {
    console.error("Error updating homepage settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add product to carousel (admin only)
const addProductToCarousel = async (req, res) => {
  try {
    const {
      productId,
      title,
      subTitle,
      description,
      mainImage,
      detailImage,
      lightBackground,
      darkBackground,
      accentColor,
      darkAccentColor,
      material,
      model,
      collection,
      displayOrder,
    } = req.body;

    // Validate required fields
    if (!productId || !title || !mainImage || !detailImage) {
      return res.status(400).json({
        message: "Product ID, title, main image, and detail image are required",
      });
    }

    // Check if product exists
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

    // Get current settings
    let settings = await HomepageSettings.getSettings();

    // Create new carousel item
    const newCarouselItem = {
      productId,
      title,
      subTitle: subTitle || product.category || "COLLECTION",
      description: description || product.description || "",
      mainImage,
      detailImage,
      lightBackground: lightBackground || "#F5F5F7",
      darkBackground: darkBackground || "#0A0A0B",
      accentColor: accentColor || "#6E44FF",
      darkAccentColor: darkAccentColor || "#8F6FFF",
      price: `$${product.price.toFixed(2)}`,
      material: material || "Premium Material",
      model: model || `MODEL.${productId.substring(0, 2)}`,
      collection: collection || product.category || "COLLECTION",
      displayOrder: displayOrder || settings.carousel.items.length,
    };

    // Add to carousel items
    settings.carousel.items.push(newCarouselItem);

    // Save updated settings
    await settings.save();

    res.status(201).json(newCarouselItem);
  } catch (error) {
    console.error("Error adding product to carousel:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove product from carousel (admin only)
const removeProductFromCarousel = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get current settings
    let settings = await HomepageSettings.getSettings();

    // Find index of product in carousel items
    const index = settings.carousel.items.findIndex(
      (item) => item.productId === productId
    );

    if (index === -1) {
      return res.status(404).json({ message: "Product not found in carousel" });
    }

    // Remove product from carousel items
    settings.carousel.items.splice(index, 1);

    // Save updated settings
    await settings.save();

    res.json({ message: "Product removed from carousel" });
  } catch (error) {
    console.error("Error removing product from carousel:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update carousel item (admin only)
const updateCarouselItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    // Get current settings
    let settings = await HomepageSettings.getSettings();

    // Find index of product in carousel items
    const index = settings.carousel.items.findIndex(
      (item) => item.productId === productId
    );

    if (index === -1) {
      return res.status(404).json({ message: "Product not found in carousel" });
    }

    // Update carousel item
    settings.carousel.items[index] = {
      ...settings.carousel.items[index],
      ...updates,
    };

    // Save updated settings
    await settings.save();

    res.json(settings.carousel.items[index]);
  } catch (error) {
    console.error("Error updating carousel item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get products for carousel selection (admin only)
const getProductsForCarousel = async (req, res) => {
  try {
    // Get all products with minimal fields
    const products = await Product.find(
      {},
      {
        id: 1,
        name: 1,
        price: 1,
        images: 1,
        category: 1,
      }
    );

    res.json(products);
  } catch (error) {
    console.error("Error fetching products for carousel:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getHomepageSettings,
  getCarouselItems,
  updateHomepageSettings,
  addProductToCarousel,
  removeProductFromCarousel,
  updateCarouselItem,
  getProductsForCarousel,
};
