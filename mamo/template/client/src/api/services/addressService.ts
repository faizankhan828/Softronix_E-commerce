import api from "./api";

export interface Address {
  _id?: string;
  userId?: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
  type?: "shipping" | "billing" | "both";
  createdAt?: string;
  updatedAt?: string;
}

// Get all addresses for the current user
export const getAddresses = async (): Promise<Address[]> => {
  try {
    const response = await api.get("/addresses");
    return response.data;
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
};

// Get a specific address by ID
export const getAddressById = async (addressId: string): Promise<Address> => {
  const response = await api.get(`/addresses/${addressId}`);
  return response.data;
};

// Create a new address
export const createAddress = async (address: Omit<Address, "_id" | "userId">): Promise<Address> => {
  const response = await api.post("/addresses", address);
  return response.data;
};

// Update an existing address
export const updateAddress = async (addressId: string, address: Partial<Address>): Promise<Address> => {
  const response = await api.put(`/addresses/${addressId}`, address);
  return response.data;
};

// Delete an address
export const deleteAddress = async (addressId: string): Promise<void> => {
  await api.delete(`/addresses/${addressId}`);
};

// Set an address as default
export const setDefaultAddress = async (addressId: string): Promise<Address> => {
  const response = await api.put(`/addresses/${addressId}/default`);
  return response.data;
};

// Save address from checkout
export const saveAddressFromCheckout = async (address: Omit<Address, "_id" | "userId">): Promise<Address> => {
  try {
    // Create a new address with the checkout data
    const response = await api.post("/addresses", {
      ...address,
      type: "both", // Default to both shipping and billing
    });
    return response.data;
  } catch (error) {
    console.error("Error saving address from checkout:", error);
    throw error;
  }
};

export default {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  saveAddressFromCheckout,
};
