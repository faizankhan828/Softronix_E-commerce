import api from "./api";
import cookies from "../../utils/cookies";

export interface OrderItem {
  productId?: string;
  product?: {
    id?: string;
    _id?: string;
    name?: string;
    price?: number;
    image?: string;
    images?: string[];
  };
  quantity?: number;
  price?: number;
  total?: number;
  variant?: {
    color?: string;
    size?: string;
  };
  color?: string;
  size?: string;
}

export interface ShippingAddress {
  fullName?: string;
  name?: string;
  addressLine1?: string;
  line1?: string;
  addressLine2?: string;
  line2?: string;
  city: string;
  state: string;
  zipCode?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

export interface JazzCashDetails {
  transactionCode?: string; // Make transactionCode optional so server can generate it
  accountNumber?: string;
  paymentImage?: string;
  paymentConfirmed?: boolean;
}

export interface TrackingTimeline {
  status: string;
  label: string;
  description: string;
  icon: string;
  completed: boolean;
  isCurrent?: boolean;
  timestamp: string | null;
  location?: string;
}

export interface TrackingInfo {
  orderId: string;
  trackingNumber: string;
  status: string;
  statusText: string;
  carrier: string;
  estimatedDelivery: string;
  currentLocation: string;
  progress: number;
  timeline: TrackingTimeline[];
  shippingAddress?: ShippingAddress;
  items?: OrderItem[];
  lastUpdate: string;
}

export interface Order {
  id?: string;
  _id?: string;
  orderId?: string;
  userId: string;
  items: OrderItem[];
  totalAmount?: number;
  total?: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  shippingMethod: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingCost?: number;
  tax?: number;
  discount?: number;
  coupon?: {
    couponId: string;
    code: string;
    type: string;
    value: number;
  };
  estimatedDelivery?: string;
  jazzCashDetails?: JazzCashDetails;
}

export const getOrders = async (): Promise<Order[]> => {
  try {
    // No need to check for token manually as the API interceptor will handle it
    const response = await api.get("/orders");
    return response.data;
  } catch (error) {
    // Return empty array on error
    return [];
  }
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    // No need to check for token manually as the API interceptor will handle it
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    // Let the caller handle the error
    throw error;
  }
};

export const createOrder = async (orderData: {
  items: { productId: string; quantity: number; size: string; color: string }[];
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: string;
  couponCode?: string | null;
  discountAmount?: number;
  jazzCashDetails?: JazzCashDetails;
}): Promise<Order> => {
  try {
    // Check if user is authenticated
    const token = cookies.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to create an order");
    }
    // Transform the data to match the server's expected structure
    const serverOrderData = {
      items: orderData.items,
      shippingAddress: {
        name: orderData.shippingAddress.fullName,
        addressLine1: orderData.shippingAddress.addressLine1,
        addressLine2: orderData.shippingAddress.addressLine2 || "",
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        postalCode: orderData.shippingAddress.zipCode,
        country: orderData.shippingAddress.country,
        phone: orderData.shippingAddress.phone,
      },
      billingAddress: {
        name: orderData.shippingAddress.fullName,
        addressLine1: orderData.shippingAddress.addressLine1,
        addressLine2: orderData.shippingAddress.addressLine2 || "",
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state,
        postalCode: orderData.shippingAddress.zipCode,
        country: orderData.shippingAddress.country,
        phone: orderData.shippingAddress.phone,
      },
      paymentMethod:
        orderData.paymentMethod === "cashOnDelivery"
          ? "cash_on_delivery"
          : orderData.paymentMethod === "jazzCash"
          ? "jazz_cash"
          : "credit_card",
      shippingMethod: orderData.shippingMethod,
      // Calculate estimated values for the server
      subtotal: 0, // Will be calculated on the server
      tax: 0, // Will be calculated on the server
      shippingCost: orderData.shippingMethod === "standard" ? 5.99 : 14.99,
      total: 0, // Will be calculated on the server
      couponCode: orderData.couponCode || undefined,
      discountAmount: orderData.discountAmount || 0,
      notes: orderData.couponCode
        ? `Coupon applied: ${orderData.couponCode}`
        : "",
      // Include Jazz Cash details if provided
      jazzCashDetails: orderData.jazzCashDetails,
    };

    const response = await api.post("/orders", serverOrderData);
    return response.data;
  } catch (error) {
    // Provide more detailed error message
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response &&
      error.response.data &&
      typeof error.response.data === "object" &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
    ) {
      throw new Error(error.response.data.message as string);
    }

    throw error;
  }
};

export const cancelOrder = async (orderId: string): Promise<void> => {
  try {
    // No need to check for token manually as the API interceptor will handle it
    await api.post(`/orders/${orderId}/cancel`);
  } catch (error) {
    // Check if this is an authentication error
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 401
    ) {
      throw new Error("Authentication required to cancel an order");
    }

    // Check if the response contains a specific error message
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response &&
      error.response.data &&
      typeof error.response.data === "object" &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
    ) {
      throw new Error(error.response.data.message as string);
    }

    throw error;
  }
};

export const updateShippingAddress = async (
  orderId: string,
  shippingAddress: ShippingAddress
): Promise<Order> => {
  try {
    // No need to check for token manually as the API interceptor will handle it
    const response = await api.put(`/orders/${orderId}/shipping-address`, {
      shippingAddress,
    });
    return response.data;
  } catch (error) {
    // Check if this is an authentication error
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 401
    ) {
      throw new Error("Authentication required to update shipping address");
    }

    throw error;
  }
};

export const updateJazzCashPayment = async (
  orderId: string,
  jazzCashDetails: {
    accountNumber?: string;
    paymentImage?: string;
  }
): Promise<Order> => {
  try {
    // No need to check for token manually as the API interceptor will handle it
    const response = await api.put(`/orders/${orderId}/jazz-cash-payment`, {
      jazzCashDetails,
    });
    return response.data;
  } catch (error) {
    // Check if this is an authentication error
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 401
    ) {
      throw new Error("Authentication required to update payment details");
    }

    throw error;
  }
};

// ── Tracking Functions ──────────────────────────────────

export const getOrderTracking = async (orderId: string): Promise<TrackingInfo> => {
  try {
    const response = await api.get(`/payment/orders/${orderId}/tracking`);
    return response.data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 401
    ) {
      throw new Error("Authentication required to track order");
    }
    throw error;
  }
};

export const trackPackageByNumber = async (trackingNumber: string): Promise<TrackingInfo> => {
  try {
    const response = await api.get(`/payment/track/${trackingNumber}`);
    return response.data;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 404
    ) {
      throw new Error("Tracking number not found");
    }
    throw error;
  }
};

export const getUserOrdersWithTracking = async (): Promise<{ orders: Order[]; total: number }> => {
  try {
    const response = await api.get("/payment/orders");
    return response.data;
  } catch (error) {
    return { orders: [], total: 0 };
  }
};

export default {
  getOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  updateShippingAddress,
  updateJazzCashPayment,
  getOrderTracking,
  trackPackageByNumber,
  getUserOrdersWithTracking,
};
