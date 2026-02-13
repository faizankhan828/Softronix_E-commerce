/**
 * Quick Backend Test - Tests all major endpoints
 * Run: node quick-test.js
 * Make sure backend server is running on port 5000
 */

import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000/api";
const results = {
  passed: [],
  failed: [],
};

// Helper function to test an endpoint
async function testEndpoint(name, url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      results.passed.push({ name, status: response.status });
      console.log(`✓ ${name} - Status: ${response.status}`);
      return { success: true, data };
    } else {
      results.failed.push({
        name,
        status: response.status,
        error: data.message,
      });
      console.log(`✗ ${name} - Status: ${response.status} - ${data.message}`);
      return { success: false, data };
    }
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log(`✗ ${name} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("═══════════════════════════════════════");
  console.log("   BACKEND API QUICK TEST SUITE");
  console.log("═══════════════════════════════════════\n");

  // Test 1: Public Store Settings
  console.log("\n━━━ Public Endpoints ━━━");
  await testEndpoint(
    "Get Public Store Settings",
    `${BASE_URL}/settings/public/store`,
  );

  // Test 2: Products
  await testEndpoint("Get All Products", `${BASE_URL}/products?limit=5`);

  await testEndpoint("Get Featured Products", `${BASE_URL}/products/featured`);

  await testEndpoint("Get Categories", `${BASE_URL}/products/categories`);

  // Test 3: Homepage Settings
  await testEndpoint("Get Homepage Settings", `${BASE_URL}/homepage/settings`);

  // Test 4: Auth Endpoints (expect to fail without credentials)
  console.log("\n━━━ Auth Endpoints (Testing Structure) ━━━");

  const registerTest = await testEndpoint(
    "Register User (missing data)",
    `${BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    },
  );

  const loginTest = await testEndpoint(
    "Login (missing data)",
    `${BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    },
  );

  // Test 5: Cart (expect to fail without auth)
  console.log("\n━━━ Protected Endpoints (Auth Required) ━━━");
  await testEndpoint("Get Cart (no auth)", `${BASE_URL}/cart`);

  await testEndpoint("Get Wishlist (no auth)", `${BASE_URL}/wishlist`);

  // Test 6: Admin Endpoints (expect to fail without admin auth)
  console.log("\n━━━ Admin Endpoints (Admin Auth Required) ━━━");
  await testEndpoint("Get Admin Stats (no auth)", `${BASE_URL}/admin/stats`);

  await testEndpoint("Get All Users (no auth)", `${BASE_URL}/admin/users`);

  // Summary
  console.log("\n═══════════════════════════════════════");
  console.log("   TEST SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`✓ Passed: ${results.passed.length}`);
  console.log(`✗ Failed: ${results.failed.length}`);
  console.log(
    `\nTotal Tests: ${results.passed.length + results.failed.length}`,
  );

  if (results.failed.length > 0) {
    console.log("\n❌ Failed Tests:");
    results.failed.forEach((test) => {
      console.log(`  - ${test.name}: ${test.error || `Status ${test.status}`}`);
    });
  }

  console.log("\n═══════════════════════════════════════\n");
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/products`);
    if (response.ok || response.status === 401) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Cannot connect to backend server.");
    console.error("   Make sure the server is running on port 5000");
    console.error("   Run: npm start (in backend directory)\n");
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  await runTests();
})();
