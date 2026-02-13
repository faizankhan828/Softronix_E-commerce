import Product from "../models/Product.js";

/**
 * Inventory Brain — Knowledge base for the AI Clerk.
 *
 * Provides semantic-ish search (MongoDB text index + smart filtering),
 * inventory checks, and product context generation for the AI.
 */

// ── Semantic Search ─────────────────────────────────────
// Uses MongoDB text index + attribute/occasion/vibe filters

export async function searchProducts({
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
}) {
  const filter = { isActive: true };

  if (inStockOnly) {
    filter.stock = { $gt: 0 };
  }

  // Text search
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
    filter["attributes.sizes"] = { $in: sizes };
  }

  if (occasion && occasion.length > 0) {
    filter.occasion = { $in: occasion.map((o) => o.toLowerCase()) };
  }

  if (vibe && vibe.length > 0) {
    filter.vibe = { $in: vibe.map((v) => v.toLowerCase()) };
  }

  if (tags && tags.length > 0) {
    filter.tags = { $in: tags.map((t) => t.toLowerCase()) };
  }

  const sortOption = query
    ? { score: { $meta: "textScore" }, rating: -1 }
    : { rating: -1, reviewCount: -1 };

  // Include hiddenBottomPrice for internal AI use, but we strip it before user-facing response
  const products = await Product.find(filter)
    .sort(sortOption)
    .limit(Number(limit))
    .lean();

  return products;
}

// ── Check Inventory ─────────────────────────────────────

export async function checkInventory(productId, { size, color } = {}) {
  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) {
    return { available: false, reason: "Product not found" };
  }

  if (product.stock <= 0) {
    return {
      available: false,
      reason: "Out of stock",
      product: sanitizeProduct(product),
    };
  }

  if (size && product.attributes.sizes.length > 0) {
    if (!product.attributes.sizes.includes(size)) {
      return {
        available: false,
        reason: `Size "${size}" not available. Options: ${product.attributes.sizes.join(", ")}`,
        product: sanitizeProduct(product),
      };
    }
  }

  if (color && product.attributes.colors.length > 0) {
    const match = product.attributes.colors.find(
      (c) => c.toLowerCase() === color.toLowerCase(),
    );
    if (!match) {
      return {
        available: false,
        reason: `Color "${color}" not available. Options: ${product.attributes.colors.join(", ")}`,
        product: sanitizeProduct(product),
      };
    }
  }

  return {
    available: true,
    stock: product.stock,
    product: sanitizeProduct(product),
  };
}

// ── Get Product Context for AI ──────────────────────────
// Generates a text representation of products for the AI system prompt

export function buildProductContext(products) {
  if (!products || products.length === 0) {
    return "No matching products found in inventory.";
  }

  return products
    .map((p, i) => {
      const price =
        p.discountedPrice != null
          ? `$${p.discountedPrice} (was $${p.price})`
          : `$${p.price}`;
      return [
        `[${i + 1}] ${p.name} (ID: ${p._id})`,
        `    Price: ${price}`,
        `    Category: ${p.category}`,
        `    Rating: ${p.rating}/5 (${p.reviewCount} reviews)`,
        `    Stock: ${p.stock} available`,
        `    Colors: ${p.attributes?.colors?.join(", ") || "N/A"}`,
        `    Sizes: ${p.attributes?.sizes?.join(", ") || "N/A"}`,
        `    Tags: ${p.tags?.join(", ") || "None"}`,
        `    Occasion: ${p.occasion?.join(", ") || "Any"}`,
        `    Vibe: ${p.vibe?.join(", ") || "Any"}`,
        `    Description: ${p.description?.slice(0, 150)}`,
        p.negotiationEnabled
          ? `    [Negotiable] Bottom price: $${p.hiddenBottomPrice}`
          : `    [Fixed price]`,
      ].join("\n");
    })
    .join("\n\n");
}

// ── Get User Purchase History Context ───────────────────

export async function getUserPurchaseContext(orders) {
  if (!orders || orders.length === 0) {
    return "No previous purchases.";
  }

  return orders
    .slice(0, 10) // Last 10 orders
    .map((o) => {
      const items = o.items
        .map((i) => `${i.name} ($${i.price} x${i.quantity})`)
        .join(", ");
      return `  - ${new Date(o.createdAt).toLocaleDateString()}: ${items}`;
    })
    .join("\n");
}

// ── Helpers ─────────────────────────────────────────────

function sanitizeProduct(product) {
  const { hiddenBottomPrice, negotiationEnabled, ...safe } = product;
  return safe;
}

// Strip hidden fields for user-facing product results
export function sanitizeProductsForUser(products) {
  return products.map(sanitizeProduct);
}
