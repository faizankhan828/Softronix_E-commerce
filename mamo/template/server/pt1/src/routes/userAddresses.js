const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const userAddressController = require("../controllers/userAddressController");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all addresses for the current user
router.get("/", userAddressController.getUserAddresses);

// Get a specific address by ID
router.get("/:id", userAddressController.getAddressById);

// Create a new address
router.post("/", userAddressController.createAddress);

// Update an existing address
router.put("/:id", userAddressController.updateAddress);

// Delete an address
router.delete("/:id", userAddressController.deleteAddress);

// Set an address as default
router.put("/:id/default", userAddressController.setDefaultAddress);

module.exports = router;
