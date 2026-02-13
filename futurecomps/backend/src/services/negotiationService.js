import Product from "../models/Product.js";

/**
 * Negotiation Service — Handles the haggle mode business logic.
 *
 * The AI Clerk calls generateCoupon with a discount when it decides to offer one.
 * This service provides validation and pricing rules.
 */

// ── Pricing Rules ───────────────────────────────────────

/**
 * Validate if a proposed discount is within acceptable limits.
 * Returns { allowed, maxDiscount, reason }
 */
export function validateDiscount(product, discountType, discountValue) {
  const currentPrice = product.discountedPrice ?? product.price;
  const bottomPrice = product.hiddenBottomPrice;

  if (!product.negotiationEnabled) {
    return {
      allowed: false,
      reason: "This product is not eligible for negotiation.",
      maxDiscount: 0,
    };
  }

  if (!bottomPrice || bottomPrice <= 0) {
    return {
      allowed: false,
      reason: "No negotiation price configured for this product.",
      maxDiscount: 0,
    };
  }

  // Calculate effective discount amount
  let discountAmount;
  if (discountType === "percentage") {
    discountAmount = currentPrice * (discountValue / 100);
  } else {
    discountAmount = discountValue;
  }

  const effectivePrice = currentPrice - discountAmount;
  const maxAllowedDiscount = currentPrice - bottomPrice;
  const maxAllowedPercentage =
    Math.floor((maxAllowedDiscount / currentPrice) * 100 * 10) / 10;

  if (effectivePrice < bottomPrice) {
    return {
      allowed: false,
      reason: `Discount exceeds our minimum price. Maximum discount available is $${maxAllowedDiscount.toFixed(2)} (${maxAllowedPercentage}%).`,
      maxDiscount: maxAllowedDiscount,
      maxPercentage: maxAllowedPercentage,
    };
  }

  return {
    allowed: true,
    discountAmount: Math.round(discountAmount * 100) / 100,
    effectivePrice: Math.round(effectivePrice * 100) / 100,
    maxDiscount: Math.round(maxAllowedDiscount * 100) / 100,
  };
}

// ── Scenarios & Suggested Discounts ─────────────────────

/**
 * Given user's negotiation scenario, suggest an appropriate discount tier.
 * This is advisory — the AI Clerk uses this to guide its decision.
 */
export function suggestDiscountTier(scenario) {
  const tiers = {
    // User gives a positive/heartfelt reason
    positiveReason: {
      scenarios: [
        "birthday",
        "anniversary",
        "first time",
        "student",
        "graduation",
      ],
      discountRange: { min: 5, max: 15 },
      description: "Generous - for genuine milestones",
    },
    // Bulk purchase
    bulkPurchase: {
      scenarios: [
        "buying multiple",
        "bulk",
        "two or more",
        "several items",
        "stocking up",
      ],
      discountRange: { min: 7, max: 20 },
      description: "Volume discount - for bulk buyers",
    },
    // Special occasion
    specialOccasion: {
      scenarios: [
        "wedding",
        "engagement",
        "baby shower",
        "housewarming",
        "christmas",
        "eid",
        "valentine",
      ],
      discountRange: { min: 5, max: 12 },
      description: "Occasion-based - moderate discount",
    },
    // Rude behavior
    rudeBehavior: {
      scenarios: ["rude", "demanding", "threat", "complaint", "worst"],
      discountRange: { min: 0, max: 0 },
      description: "No discount - may increase price",
      action: "reject",
    },
  };

  const normalizedScenario = scenario.toLowerCase();

  for (const [key, tier] of Object.entries(tiers)) {
    if (tier.scenarios.some((s) => normalizedScenario.includes(s))) {
      return { tier: key, ...tier };
    }
  }

  // Default: small gesture
  return {
    tier: "neutral",
    discountRange: { min: 0, max: 5 },
    description: "Small gesture or polite decline",
  };
}

// ── Get Negotiable Products ─────────────────────────────

export async function getNegotiableProducts(productIds = []) {
  const filter = { negotiationEnabled: true, isActive: true };
  if (productIds.length > 0) {
    filter._id = { $in: productIds };
  }
  return Product.find(filter)
    .select("name price discountedPrice hiddenBottomPrice negotiationEnabled")
    .lean();
}
