"use strict";
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Set development mode by default unless specified otherwise
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017",
    {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Run the migration
async function fixOrderIds() {
  try {
    // Wait for connection to be established
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the Orders collection directly to bypass schema validation
    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database connection not established");
      return;
    }

    const ordersCollection = db.collection("orders");

    // First, try to drop the problematic index
    try {
      console.log("Attempting to drop the id_1 index...");
      await ordersCollection.dropIndex("id_1");
      console.log("Successfully dropped index on id field");
    } catch (error) {
      console.log("Error dropping index (may not exist):", error.message);
    }

    // Find all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`Found ${orders.length} orders to process`);

    // Process each order
    for (const order of orders) {
      try {
        // Generate a new orderId if needed
        if (!order.orderId) {
          const orderId = uuidv4();

          // Update the order with the new orderId
          await ordersCollection.updateOne(
            { _id: order._id },
            {
              $set: { orderId: orderId },
            }
          );
          console.log(
            `Updated order ${order._id} with new orderId: ${orderId}`
          );
        }

        // Remove the old id field in a separate operation
        if (order.id !== undefined) {
          await ordersCollection.updateOne(
            { _id: order._id },
            { $unset: { id: "" } }
          );
          console.log(`Removed old id field from order ${order._id}`);
        }
      } catch (error) {
        console.error(`Error processing order ${order._id}:`, error.message);
      }
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the migration
fixOrderIds();
