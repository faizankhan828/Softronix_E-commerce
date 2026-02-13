const { v4: uuidv4 } = require("uuid");
const Product = require("../models/Product");

// Initial seed data - only used if database is empty
const initialProducts = [
  {
    id: "1",
    name: "Classic White T-Shirt",
    description: "A timeless white t-shirt made from 100% organic cotton.",
    price: 29.99,
    discountedPrice: null,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608246374185-a40b8d5a3fc9?q=80&w=1480&auto=format&fit=crop",
    ],
    category: "tops",
    colors: ["White", "Black", "Gray"],
    sizes: ["XS", "S", "M", "L", "XL"],
    inStock: true,
    inventory: 100,
    isNew: false,
    isFeatured: true,
    rating: 4.5,
    reviews: [
      {
        id: "101",
        userId: "2",
        userName: "Test User",
        rating: 4,
        comment: "Great quality and comfortable fit.",
        createdAt: "2023-08-15T10:30:00Z",
      },
    ],
  },
  {
    id: "2",
    name: "Slim Fit Jeans",
    description: "Modern slim fit jeans with a touch of stretch for comfort.",
    price: 59.99,
    discountedPrice: 49.99,
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1374&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1526&auto=format&fit=crop",
    ],
    category: "bottoms",
    colors: ["Blue", "Black", "Gray"],
    sizes: ["30", "32", "34", "36", "38"],
    inStock: true,
    inventory: 75,
    isNew: true,
    isFeatured: true,
    rating: 4.2,
    reviews: [],
  },
];

// Seed initial products if database is empty
const seedProducts = async () => {
  try {
    // Check if MongoDB is connected before attempting to seed
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.log(
        "MongoDB not connected yet, will seed products after connection"
      );
      return;
    }

    // Use a timeout to avoid buffering issues (increased to 15 seconds)
    const count = await Promise.race([
      Product.countDocuments(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Count operation timed out")), 15000)
      ),
    ]);

    if (count === 0) {
      console.log(
        "No products found, seeding database with initial products..."
      );
      await Product.insertMany(initialProducts);
      console.log(`Seeded ${initialProducts.length} products successfully`);
    } else {
      console.log(`Database already contains ${count} products, skipping seed`);
    }
  } catch (error) {
    console.error("Error seeding products:", error);

    // If count operation fails, try to seed anyway (in case database is empty but slow)
    try {
      console.log("Attempting to seed products despite count error...");
      await Product.insertMany(initialProducts);
      console.log(
        `Seeded ${initialProducts.length} products successfully (fallback)`
      );
    } catch (seedError) {
      console.log(
        "Seeding failed, products may already exist or database is unavailable"
      );
      // Don't throw the error, just log it
    }
  }
};

// Schedule seeding to happen after MongoDB connection is established
const mongoose = require("mongoose");
mongoose.connection.once("connected", () => {
  console.log("MongoDB connected, now seeding products...");
  setTimeout(seedProducts, 2000); // Wait 2 seconds after connection before seeding
});

// Don't call seedProducts immediately on module import

// Get all products with optional filters
const getAllProducts = async (req, res) => {
  try {
    // Check if this is an admin request
    const isAdminRequest =
      req.path.includes("/admin") || req.query.admin === "true";

    // For admin requests, return all products without pagination by default
    if (isAdminRequest) {
      const { category, search, sort } = req.query;

      // Build query object
      const query = {};

      // Apply category filter
      if (category) {
        query.category = { $regex: new RegExp(category, "i") };
      }

      // Apply search filter
      if (search) {
        const searchRegex = new RegExp(search, "i");
        query.$or = [{ name: searchRegex }, { description: searchRegex }];
      }

      // Build sort object
      let sortOption = {};
      if (sort) {
        switch (sort) {
          case "price_asc":
            sortOption = { price: 1 };
            break;
          case "price_desc":
            sortOption = { price: -1 };
            break;
          case "newest":
            sortOption = { isNew: -1, createdAt: -1 };
            break;
          case "rating":
            sortOption = { rating: -1 };
            break;
          default:
            sortOption = { createdAt: -1 };
            break;
        }
      } else {
        // Default sort by most recent
        sortOption = { createdAt: -1 };
      }

      // Execute query without pagination for admin
      const products = await Product.find(query).sort(sortOption);

      // Return all products for admin
      return res.json(products);
    }

    // For regular requests, use pagination
    const {
      category,
      search,
      sort,
      limit = 10,
      page = 1,
      minPrice,
      maxPrice,
    } = req.query;

    // Build query object
    const query = {};

    // Apply category filter
    if (category) {
      query.category = { $regex: new RegExp(category, "i") };
    }

    // Apply search filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    // Apply price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};

      if (minPrice !== undefined) {
        query.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Build sort object
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case "price_asc":
          sortOption = { price: 1 };
          break;
        case "price_desc":
          sortOption = { price: -1 };
          break;
        case "newest":
          sortOption = { isNew: -1, createdAt: -1 };
          break;
        case "rating":
          sortOption = { rating: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
          break;
      }
    } else {
      // Default sort by most recent
      sortOption = { createdAt: -1 };
    }

    // Convert limit and page to numbers
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Execute query with pagination
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Return products with pagination metadata
    res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    // Return fallback data if database is not available
    res.json({
      products: initialProducts,
      pagination: {
        total: initialProducts.length,
        page: 1,
        limit: 100,
        pages: 1,
      },
    });
  }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).limit(6);
    res.json(featuredProducts);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get new arrivals
const getNewArrivals = async (req, res) => {
  try {
    // Get homepage settings to determine the number of new arrivals to show
    let limit = 6; // Default limit

    try {
      const HomepageSettings = require("../models/HomepageSettings");
      const settings = await HomepageSettings.getSettings();
      if (settings && settings.newArrivalsCount) {
        limit = settings.newArrivalsCount;
      }
    } catch (settingsError) {
      console.warn(
        "Could not fetch homepage settings, using default limit:",
        settingsError
      );
    }

    const newArrivals = await Product.find({ isNew: true })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(newArrivals);
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    // Find product by ID - handle both ObjectId and string IDs
    let product;
    try {
      // First try to find by _id (ObjectId)
      product = await Product.findById(req.params.id);
    } catch (err) {
      // If that fails, try to find by id (string)
      product = await Product.findOne({ id: req.params.id });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check inventory availability
const checkInventory = async (req, res) => {
  try {
    const { size, color, quantity } = req.query;

    // Find product by ID - handle both ObjectId and string IDs
    let product;
    try {
      // First try to find by _id (ObjectId)
      product = await Product.findById(req.params.id);
    } catch (err) {
      // If that fails, try to find by id (string)
      product = await Product.findOne({ id: req.params.id });
    }

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
    if (size && !product.sizes.includes(size)) {
      return res.json({
        available: false,
        message: "Selected size is not available",
      });
    }

    // Check if color is available
    if (color && !product.colors.includes(color)) {
      return res.json({
        available: false,
        message: "Selected color is not available",
      });
    }

    // Check if quantity is available
    if (
      quantity &&
      product.inventory !== undefined &&
      product.inventory < parseInt(quantity)
    ) {
      return res.json({
        available: true,
        availableQuantity: product.inventory,
        message: `Only ${product.inventory} units available`,
      });
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

// Create a new product (admin only)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountedPrice,
      images,
      category,
      colors,
      sizes,
      inStock,
      inventory,
      isNew,
      isFeatured,
      material,
      fit,
      care,
      origin,
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        message: "Name, description, price, and category are required",
      });
    }

    // Create new product
    const newProduct = new Product({
      id: uuidv4(), // Generate unique ID
      name,
      description,
      price,
      discountedPrice,
      images: images || [],
      category,
      colors: colors || [],
      sizes: sizes || [],
      inStock: inStock !== undefined ? inStock : true,
      inventory,
      isNew: isNew !== undefined ? isNew : false,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      rating: 0,
      reviews: [],
      material: material || "",
      fit: fit || "",
      care: care || "",
      origin: origin || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save to database
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body;

    // Make sure updatedAt is set
    updates.updatedAt = new Date();

    // Find and update product
    const product = await Product.findOneAndUpdate(
      { id: productId },
      { $set: updates },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findOneAndDelete({ id: productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add review to product
const addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;
    const userName = req.user.name;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Find product
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already submitted a review
    const existingReviewIndex = product.reviews.findIndex(
      (review) => review.userId === userId
    );

    if (existingReviewIndex >= 0) {
      // Update existing review
      product.reviews[existingReviewIndex] = {
        ...product.reviews[existingReviewIndex],
        rating,
        comment,
        updatedAt: new Date(),
      };
    } else {
      // Add new review
      product.reviews.push({
        id: uuidv4(),
        userId,
        userName,
        rating,
        comment,
        createdAt: new Date(),
      });
    }

    // Recalculate average rating
    const totalRating = product.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    product.rating = totalRating / product.reviews.length;

    // Save product
    await product.save();

    res.json(product);
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get product categories
const getProductCategories = async (req, res) => {
  try {
    // Get distinct categories
    const categories = await Product.distinct("category");
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);

    // Return fallback categories if database is not available
    const fallbackCategories = ["tops", "bottoms", "accessories"];
    res.json(fallbackCategories);
  }
};

module.exports = {
  getAllProducts,
  getFeaturedProducts,
  getNewArrivals,
  getProductById,
  checkInventory,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  getProductCategories,
};
