import Product from "../models/Product.js";

// ── Public ──────────────────────────────────────────────────────────

/**
 * GET /api/products
 * Supports: ?search, ?category, ?minPrice, ?maxPrice, ?color, ?size,
 *            ?occasion, ?vibe, ?tag, ?sort, ?page, ?limit, ?featured, ?new
 */
export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      color,
      size,
      occasion,
      vibe,
      tag,
      sort,
      page = 1,
      limit = 20,
      featured,
      isNew,
    } = req.query;

    const filter = { isActive: true };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Category filter
    if (category) {
      filter.category = { $regex: new RegExp(category, "i") };
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Attribute filters
    if (color) {
      filter["attributes.colors"] = {
        $in: color.split(",").map((c) => new RegExp(c.trim(), "i")),
      };
    }
    if (size) {
      filter["attributes.sizes"] = {
        $in: size.split(",").map((s) => s.trim().toUpperCase()),
      };
    }

    // Occasion / vibe / tag filters
    if (occasion) {
      filter.occasion = {
        $in: occasion.split(",").map((o) => o.trim().toLowerCase()),
      };
    }
    if (vibe) {
      filter.vibe = {
        $in: vibe.split(",").map((v) => v.trim().toLowerCase()),
      };
    }
    if (tag) {
      filter.tags = {
        $in: tag.split(",").map((t) => t.trim().toLowerCase()),
      };
    }

    // Boolean flags
    if (featured === "true") filter.isFeatured = true;
    if (isNew === "true") filter.isNew = true;

    // Sort options
    let sortOption = { createdAt: -1 }; // default: newest
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "rating") sortOption = { rating: -1 };
    else if (sort === "name_asc") sortOption = { name: 1 };
    else if (sort === "name_desc") sortOption = { name: -1 };
    else if (sort === "popular") sortOption = { reviewCount: -1 };
    // If text search, add text‑score sort
    if (search) {
      sortOption = { score: { $meta: "textScore" }, ...sortOption };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Projection: exclude hiddenBottomPrice from public routes
    const projection = { hiddenBottomPrice: 0, negotiationEnabled: 0 };

    const [products, total] = await Promise.all([
      Product.find(filter, projection)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/**
 * GET /api/products/featured
 * Get featured products with optional limit
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log("Fetching featured products with limit:", limit);

    const products = await Product.find({
      isActive: true,
      isFeatured: true,
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select("-hiddenBottomPrice -negotiationEnabled")
      .lean();

    console.log(`Found ${products.length} featured products`);
    res.json(products);
  } catch (error) {
    console.error("getFeaturedProducts error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Failed to fetch featured products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/products/random
 * Get random products with optional limit
 */
export const getRandomProducts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    console.log("Fetching random products with limit:", limit);

    const products = await Product.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: Number(limit) } },
      {
        $project: {
          hiddenBottomPrice: 0,
          negotiationEnabled: 0,
        },
      },
    ]);

    console.log(`Found ${products.length} random products`);
    res.json(products);
  } catch (error) {
    console.error("getRandomProducts error:", error);
    res.status(500).json({
      message: "Failed to fetch random products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/products/categories
 */
export const getCategories = async (_req, res) => {
  try {
    const categories = await Product.distinct("category", { isActive: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

/**
 * GET /api/products/:id
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select("-hiddenBottomPrice -negotiationEnabled")
      .lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// ── Admin ───────────────────────────────────────────────────────────

/**
 * POST /api/products  (Admin)
 */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountedPrice,
      currency,
      category,
      attributes,
      imageUrl,
      images,
      stock,
      tags,
      occasion,
      vibe,
      hiddenBottomPrice,
      negotiationEnabled,
      isFeatured,
      isNew,
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      discountedPrice: discountedPrice ?? null,
      currency: currency || "usd",
      category,
      attributes: {
        colors: attributes?.colors || [],
        sizes: attributes?.sizes || [],
      },
      imageUrl: imageUrl || "",
      images: images || [],
      stock: stock ?? 0,
      tags: tags || [],
      occasion: occasion || [],
      vibe: vibe || [],
      hiddenBottomPrice: hiddenBottomPrice ?? null,
      negotiationEnabled: negotiationEnabled ?? false,
      isFeatured: isFeatured ?? false,
      isNew: isNew ?? true,
    });

    const created = await product.save();
    res.status(201).json(created);
  } catch (error) {
    console.error("createProduct error:", error);
    res.status(500).json({ message: "Failed to create product" });
  }
};

/**
 * PUT /api/products/:id  (Admin)
 */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "discountedPrice",
      "currency",
      "category",
      "attributes",
      "imageUrl",
      "images",
      "stock",
      "tags",
      "occasion",
      "vibe",
      "hiddenBottomPrice",
      "negotiationEnabled",
      "isFeatured",
      "isNew",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "attributes") {
          product.attributes = {
            colors: req.body.attributes.colors ?? product.attributes.colors,
            sizes: req.body.attributes.sizes ?? product.attributes.sizes,
          };
        } else {
          product[field] = req.body[field];
        }
      }
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
};

/**
 * DELETE /api/products/:id  (Admin) — soft-delete
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.isActive = false;
    await product.save();
    res.json({ message: "Product deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};

/**
 * GET /api/products/admin/all  (Admin) — includes inactive & hidden fields
 */
export const getAllProductsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments({}),
    ]);

    res.json({
      products,
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ── Reviews ─────────────────────────────────────────────────────────

/**
 * POST /api/products/:id/reviews  (Authenticated)
 */
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed
    const existing = product.reviews.find(
      (r) => r.userId.toString() === req.user._id.toString(),
    );
    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    product.reviews.push({
      userId: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment: comment || "",
    });

    await product.save(); // pre-save hook recalculates rating
    res.status(201).json({
      message: "Review added",
      rating: product.rating,
      reviewCount: product.reviewCount,
    });
  } catch (error) {
    console.error("addReview error:", error);
    res.status(500).json({ message: "Failed to add review" });
  }
};
