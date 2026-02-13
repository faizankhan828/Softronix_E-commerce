import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import addressService, { Address } from "../api/services/addressService";
import { useAuth } from "./AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface AddressContextType {
  addresses: Address[];
  loading: boolean;
  error: string | null;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, "_id" | "userId">) => Promise<Address>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<Address>;
  getDefaultAddress: (type?: "shipping" | "billing" | "both") => Address | null;
  saveAddressFromCheckout: (address: Omit<Address, "_id" | "userId">) => Promise<Address>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) {
      setAddresses([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedAddresses = await addressService.getAddresses();
      setAddresses(fetchedAddresses);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Failed to fetch addresses. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to fetch addresses. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  const addAddress = async (address: Omit<Address, "_id" | "userId">): Promise<Address> => {
    setLoading(true);
    setError(null);

    try {
      const newAddress = await addressService.createAddress(address);
      setAddresses((prev) => [...prev, newAddress]);
      toast({
        title: "Success",
        description: "Address added successfully.",
      });
      return newAddress;
    } catch (err) {
      console.error("Error adding address:", err);
      setError("Failed to add address. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to add address. Please try again later.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (id: string, address: Partial<Address>): Promise<Address> => {
    setLoading(true);
    setError(null);

    try {
      const updatedAddress = await addressService.updateAddress(id, address);
      setAddresses((prev) =>
        prev.map((addr) => (addr._id === id ? updatedAddress : addr))
      );
      toast({
        title: "Success",
        description: "Address updated successfully.",
      });
      return updatedAddress;
    } catch (err) {
      console.error("Error updating address:", err);
      setError("Failed to update address. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to update address. Please try again later.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await addressService.deleteAddress(id);
      setAddresses((prev) => prev.filter((addr) => addr._id !== id));
      toast({
        title: "Success",
        description: "Address deleted successfully.",
      });
    } catch (err) {
      console.error("Error deleting address:", err);
      setError("Failed to delete address. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again later.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setDefaultAddress = async (id: string): Promise<Address> => {
    setLoading(true);
    setError(null);

    try {
      const updatedAddress = await addressService.setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr._id === id,
        }))
      );
      toast({
        title: "Success",
        description: "Default address updated successfully.",
      });
      return updatedAddress;
    } catch (err) {
      console.error("Error setting default address:", err);
      setError("Failed to set default address. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to set default address. Please try again later.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAddress = (type: "shipping" | "billing" | "both" = "both"): Address | null => {
    // Filter addresses by type
    const filteredAddresses = addresses.filter(
      (addr) => addr.type === type || addr.type === "both"
    );

    // Find the default address
    const defaultAddress = filteredAddresses.find((addr) => addr.isDefault);

    // If no default address, return the most recently created one
    if (!defaultAddress && filteredAddresses.length > 0) {
      return filteredAddresses.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0];
    }

    return defaultAddress || null;
  };

  const saveAddressFromCheckout = async (address: Omit<Address, "_id" | "userId">): Promise<Address> => {
    setLoading(true);
    setError(null);

    try {
      const newAddress = await addressService.saveAddressFromCheckout(address);
      setAddresses((prev) => [...prev, newAddress]);
      toast({
        title: "Success",
        description: "Address saved for future use.",
      });
      return newAddress;
    } catch (err) {
      console.error("Error saving address from checkout:", err);
      setError("Failed to save address. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to save address. Please try again later.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initial load of addresses
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated, fetchAddresses]);

  const value = {
    addresses,
    loading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    saveAddressFromCheckout,
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
};

export const useAddress = (): AddressContextType => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error("useAddress must be used within an AddressProvider");
  }
  return context;
};
