import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

console.log("=== Environment Variable Test ===\n");

// Test VAPID Keys
console.log("VAPID Keys:");
console.log("  Public Key:", process.env.VAPID_PUBLIC_KEY ? "✓ Set" : "✗ Missing");
console.log("  Private Key:", process.env.VAPID_PRIVATE_KEY ? "✓ Set" : "✗ Missing");

// Test Stripe Keys
console.log("\nStripe Keys:");
console.log("  Secret Key:", process.env.STRIPE_SECRET_KEY ? "✓ Set" : "✗ Missing");
console.log("  Webhook Secret:", process.env.STRIPE_WEBHOOK_SECRET ? "✓ Set" : "✗ Missing");

// Test MongoDB
console.log("\nMongoDB:");
console.log("  URI:", process.env.MONGODB_URI ? "✓ Set" : "✗ Missing");

// Test JWT
console.log("\nJWT:");
console.log("  Secret:", process.env.JWT_SECRET ? "✓ Set" : "✗ Missing");

// Test Email
console.log("\nEmail:");
console.log("  User:", process.env.EMAIL_USER ? "✓ Set" : "✗ Missing");
console.log("  Password:", process.env.EMAIL_PASSWORD ? "✓ Set" : "✗ Missing");

// Test ImageKit
console.log("\nImageKit:");
console.log("  Public Key:", process.env.IMAGEKIT_PUBLIC_KEY ? "✓ Set" : "✗ Missing");
console.log("  Private Key:", process.env.IMAGEKIT_PRIVATE_KEY ? "✓ Set" : "✗ Missing");
console.log("  URL Endpoint:", process.env.IMAGEKIT_URL_ENDPOINT ? "✓ Set" : "✗ Missing");

console.log("\n=== Test Complete ===");

// If Stripe key exists, test connection
if (process.env.STRIPE_SECRET_KEY) {
  console.log("\nTesting Stripe connection...");
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const balance = await stripe.balance.retrieve();
    console.log("Stripe connection: ✓ Success");
    console.log("  Available:", balance.available.map(b => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(", "));
  } catch (error) {
    console.log("Stripe connection: ✗ Failed -", error.message);
  }
}
