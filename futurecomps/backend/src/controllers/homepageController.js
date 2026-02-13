import HomepageSettings from "../models/HomepageSettings.js";
import Product from "../models/Product.js";

// Get homepage settings
export const getHomepageSettings = async (req, res) => {
  try {
    let settings = await HomepageSettings.findOne();
    if (!settings) {
      // Create default settings if not exists
      settings = await HomepageSettings.create({
        carousel: { items: [] },
        featuredCategories: [],
        shopBenefits: { items: [] },
      });
    }
    res.json(settings);
  } catch (error) {
    console.error("Error fetching homepage settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update homepage settings
export const updateHomepageSettings = async (req, res) => {
  try {
    let settings = await HomepageSettings.findOne();
    if (!settings) {
      settings = new HomepageSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error("Error updating homepage settings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get carousel items
export const getCarouselItems = async (req, res) => {
  try {
    const settings = await HomepageSettings.findOne();
    res.json(settings ? settings.carousel.items : []);
  } catch (error) {
    console.error("Error fetching carousel items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add product to carousel
export const addProductToCarousel = async (req, res) => {
  try {
    const settings = await HomepageSettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    settings.carousel.items.push(req.body);
    await settings.save();
    res.json(settings.carousel.items[settings.carousel.items.length - 1]);
  } catch (error) {
    console.error("Error adding to carousel:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove product from carousel
export const removeProductFromCarousel = async (req, res) => {
  try {
    const settings = await HomepageSettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    settings.carousel.items = settings.carousel.items.filter(
      (item) => item.productId.toString() !== req.params.productId
    );
    await settings.save();
    res.json({ message: "Item removed" });
  } catch (error) {
    console.error("Error removing from carousel:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update carousel item
export const updateCarouselItem = async (req, res) => {
  try {
    const settings = await HomepageSettings.findOne();
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    const itemIndex = settings.carousel.items.findIndex(
      (item) => item.productId.toString() === req.params.productId
    );
    if (itemIndex > -1) {
      Object.assign(settings.carousel.items[itemIndex], req.body);
      await settings.save();
      res.json(settings.carousel.items[itemIndex]);
    } else {
      res.status(404).json({ message: "Item not found" });
    }
  } catch (error) {
    console.error("Error updating carousel item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get products for carousel selection
export const getProductsForCarousel = async (req, res) => {
  try {
    const products = await Product.find({}, "name imageUrl price");
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};
