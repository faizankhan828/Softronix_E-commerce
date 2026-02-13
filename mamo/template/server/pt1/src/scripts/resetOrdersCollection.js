"use strict";
const mongoose = require("mongoose");
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
    process.env.MONGODB_URI || "mongodb://localhost:27017/",
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

// Run the reset
async function resetOrdersCollection() {
  try {
    // Wait for connection to be established
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get the database connection
    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database connection not established");
      return;
    }

    console.log("Dropping orders collection...");

    try {
      // Drop the entire orders collection
      await db.collection("orders").drop();
      console.log("Orders collection dropped successfully");
    } catch (error) {
      // Collection might not exist
      console.log("Could not drop orders collection:", error.message);
    }

    // Create the orders collection implicitly by inserting a dummy document
    console.log("Creating new orders collection...");
    await db.collection("orders").insertOne({ dummy: true });
    await db.collection("orders").deleteOne({ dummy: true });
    console.log("Orders collection created successfully");

    // Create the proper index on orderId
    console.log("Creating index on orderId...");
    await db.collection("orders").createIndex({ orderId: 1 }, { unique: true });
    console.log("Index created successfully");

    console.log("Orders collection reset completed successfully");
  } catch (error) {
    console.error("Reset failed:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the reset
resetOrdersCollection();
