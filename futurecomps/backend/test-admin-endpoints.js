// Test script to check admin endpoint responses
import fetch from "node-fetch";

const API_BASE = "http://localhost:5000/api";
let TOKEN = ""; // Will be set after login

// Test user credentials (you'll need to use your actual admin credentials)
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin@123";

async function login() {
  console.log("🔐 Logging in as admin...");
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const data = await response.json();

    if (data.token) {
      TOKEN = data.token;
      console.log("✅ Login successful\n");
      return true;
    } else {
      console.log("❌ Login failed:", data);
      return false;
    }
  } catch (error) {
    console.log("❌ Login error:", error.message);
    return false;
  }
}

async function testEndpoint(name, url) {
  console.log(`\n📡 Testing: ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`   Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Response structure:`);
      console.log(
        JSON.stringify(data, null, 2).split("\n").slice(0, 30).join("\n"),
      );
      if (JSON.stringify(data).length > 1000) {
        console.log("   ... (truncated)");
      }
      return data;
    } else {
      const error = await response.text();
      console.log(`   ❌ Error:`, error);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Request failed:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("ADMIN API ENDPOINTS TEST");
  console.log("=".repeat(60));

  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.log("❌ Cannot proceed without login");
    return;
  }

  // Test all admin endpoints
  console.log("\n" + "=".repeat(60));
  console.log("TESTING ADMIN ENDPOINTS");
  console.log("=".repeat(60));

  const endpoints = [
    // Stats endpoint
    ["Admin Stats", "/admin/stats"],

    // Users endpoint
    ["Admin Users", "/admin/users"],
    ["Admin Users (paginated)", "/admin/users?page=1&limit=5"],

    // Orders endpoint
    ["Admin Orders", "/admin/orders"],
    ["Admin Orders (paginated)", "/admin/orders?page=1&limit=5"],

    // Products endpoint
    ["Products", "/products"],
    ["Products (admin)", "/products?admin=true"],

    // Coupons endpoint
    ["Coupons", "/coupons"],
  ];

  const results = {};
  for (const [name, url] of endpoints) {
    results[name] = await testEndpoint(name, url);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay between requests
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  for (const [name, url] of endpoints) {
    const data = results[name];
    if (data) {
      const keys = Object.keys(data);
      console.log(`✅ ${name}: {${keys.join(", ")}}`);
    } else {
      console.log(`❌ ${name}: FAILED`);
    }
  }
}

// Run tests
runTests().catch(console.error);
