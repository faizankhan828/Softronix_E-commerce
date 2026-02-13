import pkg from "@imagekit/nodejs";
const ImageKit = pkg.default || pkg;
import dotenv from "dotenv";

dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

console.log("=== Testing Authentication Methods ===\n");

// Check instance properties
console.log("Instance keys:", Object.keys(imagekit));

// Check prototype methods
console.log(
  "\nPrototype methods:",
  Object.getOwnPropertyNames(Object.getPrototypeOf(imagekit)),
);

// Try to find authentication method
console.log("\nChecking authentication methods:");
console.log(
  "getAuthenticationParameters:",
  typeof imagekit.getAuthenticationParameters,
);

// Check all available methods
console.log("\nAll available methods:");
const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(imagekit));
allMethods.forEach((method) => {
  if (typeof imagekit[method] === "function" && !method.startsWith("_")) {
    console.log(`  - ${method}`);
  }
});

// Test if we can call it
if (typeof imagekit.getAuthenticationParameters === "function") {
  try {
    const auth = imagekit.getAuthenticationParameters();
    console.log("\nAuthentication result:", auth);
  } catch (e) {
    console.log("\nAuthentication error:", e.message);
  }
}

// Check authentication namespace
if (imagekit.auth) {
  console.log("\nauth namespace exists");
  console.log("auth methods:", Object.keys(imagekit.auth));
}

if (imagekit.authentication) {
  console.log("\nauthentication namespace exists");
  console.log("authentication methods:", Object.keys(imagekit.authentication));
}

// Check helper namespace - this might have auth methods
if (imagekit.helper) {
  console.log("\nhelper namespace exists");
  console.log("helper type:", typeof imagekit.helper);
  if (typeof imagekit.helper === "object") {
    console.log("helper keys:", Object.keys(imagekit.helper));
    // Check prototype methods
    console.log(
      "helper methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(imagekit.helper)),
    );

    // Try common auth method names
    console.log("\nChecking helper authentication methods:");
    console.log(
      "  getAuthenticationParameters:",
      typeof imagekit.helper.getAuthenticationParameters,
    );
    console.log(
      "  generateAuthentication:",
      typeof imagekit.helper.generateAuthentication,
    );
    console.log("  getAuthParams:", typeof imagekit.helper.getAuthParams);

    // If we find a method, try calling it
    if (typeof imagekit.helper.getAuthenticationParameters === "function") {
      try {
        const auth = imagekit.helper.getAuthenticationParameters();
        console.log("\nAuthentication result:", auth);
      } catch (e) {
        console.log("\nAuthentication error:", e.message);
      }
    }
  }
}
