
import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000/api";
let adminToken = "";
let testProductId = "";

// Credentials
const ADMIN = { email: "admin@softronix.com", password: "password123" };

async function request(url, options = {}) {
  try {
    const response = await fetch(BASE_URL + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function runTests() {
  console.log("🔍 Starting Reproduction Tests...");

  // 1. Get Admin Token
  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(ADMIN),
  });
  
  if (login.ok) {
    adminToken = login.data.token;
    console.log("✅ Admin Login Successful");
  } else {
    console.error("❌ Admin Login Failed");
    return;
  }

  // 2. Get a Product ID for testing (Validation Issue)
  const products = await request("/products");
  if (products.ok && products.data.products.length > 0) {
    testProductId = products.data.products[0]._id;
    console.log(`✅ Retrieved Product ID: ${testProductId}`);
  } else {
    console.error("❌ Failed to get products");
    return;
  }

  const headers = { Authorization: `Bearer ${adminToken}` };

  // ---------------------------------------------------------
  // BUG 1: Wishlist Add (Incorrect Endpoint)
  // Expected: 404
  // ---------------------------------------------------------
  console.log("\n🧪 Testing Bug #1: Wishlist Add (Incorrect Endpoint)...");
  const wishlistRes = await request("/wishlist/add", {
    method: "POST",
    headers,
    body: JSON.stringify({ productId: testProductId }),
  });
  console.log(`Result: ${wishlistRes.status} (Expected 404)`);
  if (wishlistRes.status === 404) console.log("✅ Bug Reproduction Successful (Got 404)");

  // ---------------------------------------------------------
  // BUG 2: Coupon Validation (Incorrect Endpoint/Method)
  // Expected: 404
  // ---------------------------------------------------------
  console.log("\n🧪 Testing Bug #2: Coupon Validation (Incorrect Endpoint)...");
  const couponRes = await request("/coupons/validate/TEST123_INVALID", {
      method: "POST",
      headers,
      body: JSON.stringify({ cartTotal: 100 }),
  });
  console.log(`Result: ${couponRes.status} (Expected 404)`);
  if (couponRes.status === 404) console.log("✅ Bug Reproduction Successful (Got 404)");

  // ---------------------------------------------------------
  // BUG 3: Coupon Deletion (Incorrect Method)
  // Expected: 404
  // ---------------------------------------------------------
  // First create a dummy coupon to try deleting
  const newCoupon = {
    code: `DEL${Date.now()}`,
    discountType: "percentage",
    discountValue: 10,
    minPurchase: 50,
    maxUses: 100,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
  const createCoupon = await request("/coupons", {
      method: "POST",
      headers,
      body: JSON.stringify(newCoupon),
  });
  
  if (createCoupon.ok) {
      const couponId = createCoupon.data._id;
      console.log("\n🧪 Testing Bug #3: Coupon Deletion (Incorrect Endpoint)...");
      const deleteRes = await request(`/coupons/${couponId}`, {
          method: "DELETE",
          headers,
      });
      console.log(`Result: ${deleteRes.status} (Expected 404)`);
      if (deleteRes.status === 404) console.log("✅ Bug Reproduction Successful (Got 404)");
  }
}

runTests();
