
import express from "express";
import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// VAPID keys should be generated once and stored in .env
// You can generate them using: web-push generate-vapid-keys
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (!publicVapidKey || !privateVapidKey) {
  console.error(
    "VAPID keys are missing! Please generate them and add to .env"
  );
} else {
  webpush.setVapidDetails(
    "mailto:test@example.com",
    publicVapidKey,
    privateVapidKey
  );
}

// Get VAPID Public Key
router.get("/vapid-key", (req, res) => {
  res.json({ publicKey: publicVapidKey });
});

// Subscribe Route
router.post("/subscribe", async (req, res) => {
  const subscription = req.body;

  try {
    // Check if subscription already exists
    const existing = await PushSubscription.findOne({
      endpoint: subscription.endpoint,
    });
    if (!existing) {
      await PushSubscription.create(subscription);
    }
    res.status(201).json({ message: "Subscription added successfully." });
  } catch (error) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ error: "Failed to save subscription." });
  }
});

// Send Test Notification Route
router.post("/send-test", async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find();
    if (subscriptions.length === 0) {
      return res.status(200).json({ message: "No subscriptions found." });
    }

    const payload = JSON.stringify({
      title: "Test Notification",
      body: "This is a test notification from the PWA!",
    });

    const notifications = subscriptions.map((sub) => {
      // In a real app, you might want to validate the subscription object structure here
        const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
                auth: sub.keys.auth,
                p256dh: sub.keys.p256dh
            }
        };

      return webpush
        .sendNotification(pushConfig, payload)
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription is gone, remove it
            console.log("Subscription expired/invalid, removing:", sub.endpoint);
            await PushSubscription.deleteOne({ _id: sub._id });
          } else {
            console.error("Error sending notification:", err);
          }
        });
    });

    await Promise.all(notifications);
    res.json({ message: "Test notifications sent!" });
  } catch (error) {
    console.error("Error sending test notifications:", error);
    res.status(500).json({ error: "Failed to send notifications." });
  }
});

export default router;
