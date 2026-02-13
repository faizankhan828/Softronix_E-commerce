
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js"; // You might need this if you want to link orders to users

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Checkout Session
router.post("/create-checkout-session", express.json(), async (req, res) => {
  const { productId, userId } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description,
              images: product.imageUrl ? [product.imageUrl] : [],
            },
            unit_amount: Math.round(product.price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: userId,
        productId: productId,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Webhook to handle successful payments
// NOTE: This route needs raw body parser in server.js middleware configuration
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Fulfill the order
      try {
        const order = new Order({
          userId: session.metadata.userId,
          productId: session.metadata.productId,
          stripeSessionId: session.id,
          amount: session.amount_total / 100,
          currency: session.currency,
          status: "paid",
        });
        await order.save();
        console.log("Order fulfilled:", order);
      } catch (error) {
        console.error("Error saving order:", error);
      }
    }

    res.json({ received: true });
  }
);

export default router;
