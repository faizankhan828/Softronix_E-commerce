import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe coupon + promotion code to match our DB coupon.
 * Returns { stripeCouponId, stripePromotionCodeId }.
 */
export async function createStripeCoupon(coupon) {
  try {
    const couponParams = {
      metadata: { dbCouponId: coupon._id.toString(), code: coupon.code },
    };

    if (coupon.discountType === "percentage") {
      couponParams.percent_off = coupon.discountValue;
    } else {
      // Stripe expects amount in cents
      couponParams.amount_off = Math.round(coupon.discountValue * 100);
      couponParams.currency = "usd";
    }

    if (coupon.expiresAt) {
      couponParams.redeem_by = Math.floor(
        new Date(coupon.expiresAt).getTime() / 1000,
      );
    }

    if (coupon.usageLimit) {
      couponParams.max_redemptions = coupon.usageLimit;
    }

    const stripeCoupon = await stripe.coupons.create(couponParams);

    // Create a promotion code using our code string
    const promoCode = await stripe.promotionCodes.create({
      coupon: stripeCoupon.id,
      code: coupon.code,
      active: coupon.isActive,
    });

    return {
      stripeCouponId: stripeCoupon.id,
      stripePromotionCodeId: promoCode.id,
    };
  } catch (error) {
    console.error("Stripe coupon creation error:", error.message);
    // Non-fatal — coupon still works in our system even if Stripe sync fails
    return { stripeCouponId: null, stripePromotionCodeId: null };
  }
}

/**
 * Deactivate a Stripe coupon.
 */
export async function deactivateStripeCoupon(stripeCouponId) {
  try {
    if (!stripeCouponId) return;
    await stripe.coupons.del(stripeCouponId);
  } catch (error) {
    console.error("Stripe coupon deactivation error:", error.message);
  }
}

/**
 * Create a Stripe checkout session for the cart.
 * Accepts array of line items and optional promotion code.
 */
export async function createCheckoutSession({
  lineItems,
  userId,
  couponCode,
  stripePromotionCodeId,
  successUrl,
  cancelUrl,
  metadata = {},
}) {
  console.log("👳 Stripe Service - Creating session...");
  console.log("   User ID:", userId);
  console.log("   Line items count:", lineItems?.length || 0);
  console.log("   Coupon code:", couponCode || "None");
  console.log("   Promotion code ID:", stripePromotionCodeId || "None");
  
  const sessionParams = {
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url:
      successUrl ||
      `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cancel`,
    metadata: {
      userId,
      ...metadata,
    },
  };

  // Apply promotion code if available
  if (stripePromotionCodeId) {
    sessionParams.discounts = [{ promotion_code: stripePromotionCodeId }];
    console.log("✅ Applying promotion code to session");
  }

  // Allow user-entered promo codes if no code pre-applied
  if (!stripePromotionCodeId) {
    sessionParams.allow_promotion_codes = true;
    console.log("🎫 Allowing manual promo code entry");
  }

  console.log("📤 Sending request to Stripe API...");
  const session = await stripe.checkout.sessions.create(sessionParams);
  console.log("✅ Stripe session created:", session.id);
  return session;
}

/**
 * Verify a Stripe webhook event.
 */
export function constructWebhookEvent(body, signature) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
}

export { stripe };
