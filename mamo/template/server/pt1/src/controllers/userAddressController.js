const UserAddress = require("../models/UserAddress");

// Get all addresses for the current user
const getUserAddresses = async (req, res) => {
  try {
    const addresses = await UserAddress.find({ userId: req.user.id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json(addresses);
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a specific address by ID
const getAddressById = async (req, res) => {
  try {
    const address = await UserAddress.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json(address);
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new address
const createAddress = async (req, res) => {
  try {
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
      type,
    } = req.body;

    // Validate required fields
    if (!name || !addressLine1 || !city || !state || !postalCode || !country || !phone) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // If this is the default address, unset any existing default addresses
    if (isDefault) {
      await UserAddress.updateMany(
        { userId: req.user.id, type: type || "both" },
        { $set: { isDefault: false } }
      );
    }

    // Check if this is the first address for the user
    const addressCount = await UserAddress.countDocuments({ userId: req.user.id });
    const shouldBeDefault = addressCount === 0;

    // Create new address
    const newAddress = new UserAddress({
      userId: req.user.id,
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault: isDefault || shouldBeDefault,
      type: type || "both",
    });

    await newAddress.save();
    res.status(201).json(newAddress);
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update an existing address
const updateAddress = async (req, res) => {
  try {
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
      type,
    } = req.body;

    // Find address
    const address = await UserAddress.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // If setting as default, unset any existing default addresses
    if (isDefault && !address.isDefault) {
      await UserAddress.updateMany(
        { userId: req.user.id, type: type || address.type },
        { $set: { isDefault: false } }
      );
    }

    // Update fields
    if (name) address.name = name;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;
    if (phone) address.phone = phone;
    if (isDefault !== undefined) address.isDefault = isDefault;
    if (type) address.type = type;

    await address.save();
    res.json(address);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete an address
const deleteAddress = async (req, res) => {
  try {
    const address = await UserAddress.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await address.remove();

    // If this was the default address, set another address as default
    if (address.isDefault) {
      const nextAddress = await UserAddress.findOne({
        userId: req.user.id,
        type: address.type,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.json({ message: "Address removed" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Set an address as default
const setDefaultAddress = async (req, res) => {
  try {
    const address = await UserAddress.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Unset any existing default addresses of the same type
    await UserAddress.updateMany(
      { userId: req.user.id, type: address.type },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    res.json(address);
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
