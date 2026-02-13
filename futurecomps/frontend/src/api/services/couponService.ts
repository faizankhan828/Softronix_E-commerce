import api from "./api";

export interface Coupon {
  _id?: string;
  code: string;
  description: string;
  type: "percentage" | "fixed" | "shipping";
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  applicableProducts: string[];
  excludedProducts: string[];
  applicableCategories: string[];
  userRestriction: string[];
  oneTimePerUser: boolean;
  usedBy: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Get all coupons (admin only)
export const getAllCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await api.get("/coupons");
    return response.data;
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
};

// Get a specific coupon by ID (admin only)
export const getCouponById = async (couponId: string): Promise<Coupon | null> => {
  try {
    const response = await api.get(`/coupons/${couponId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching coupon ${couponId}:`, error);
    return null;
  }
};

// Create a new coupon (admin only)
export const createCoupon = async (couponData: Omit<Coupon, "_id" | "usageCount" | "usedBy" | "createdAt" | "updatedAt">): Promise<Coupon> => {
  const response = await api.post("/coupons", couponData);
  return response.data;
};

// Update a coupon (admin only)
export const updateCoupon = async (couponId: string, couponData: Partial<Coupon>): Promise<Coupon> => {
  const response = await api.put(`/coupons/${couponId}`, couponData);
  return response.data;
};

// Delete a coupon (admin only)
export const deleteCoupon = async (couponId: string): Promise<void> => {
  await api.delete(`/coupons/${couponId}`);
};

// Validate a coupon code
export const validateCoupon = async (code: string): Promise<{
  valid: boolean;
  coupon?: Partial<Coupon>;
  discountAmount?: number;
  message: string;
}> => {
  try {
    const response = await api.post("/coupons/validate", { code });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        valid: false,
        message: error.response.data.message || "Invalid coupon code",
      };
    }
    return {
      valid: false,
      message: "Error validating coupon",
    };
  }
};

// Apply a coupon to the cart
export const applyCoupon = async (code: string): Promise<{
  discountAmount: number;
  couponCode: string;
  cartTotal: number;
  finalTotal: number;
  message: string;
}> => {
  const response = await api.post("/coupons/apply", { code });
  return response.data;
};

// Remove a coupon from the cart
export const removeCoupon = async (): Promise<{ message: string }> => {
  const response = await api.post("/coupons/remove");
  return response.data;
};

export default {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  removeCoupon,
};
