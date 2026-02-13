import api from "./api";

export interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  taxRate: number;
  notifications: {
    emailNotifications: boolean;
    orderConfirmations: boolean;
    stockAlerts: boolean;
    marketingEmails: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordExpiry: number;
  };
}

export interface UserPreferences {
  newsletter: boolean;
  marketing: boolean;
  accountActivity: boolean;
}

const settingsService = {
  // Get store settings (public endpoint that doesn't require authentication)
  getStoreSettings: async (): Promise<StoreSettings> => {
    try {
      const response = await api.get<StoreSettings>("/settings/public/store");
      return response.data;
    } catch (error) {
      console.warn(
        "Failed to fetch store settings from public endpoint, using default settings"
      );
      // Return default settings if the API call fails
      return {
        storeName: "My E-Commerce Store",
        storeEmail: "contact@mystore.com",
        storePhone: "+1 (555) 123-4567",
        storeAddress: "123 Main St, City, Country",
        currency: "USD",
        taxRate: 7.5,
        notifications: {
          emailNotifications: true,
          orderConfirmations: true,
          stockAlerts: true,
          marketingEmails: false,
        },
        security: {
          sessionTimeout: 30,
          passwordExpiry: 90,
        },
      };
    }
  },

  // Update store settings (admin only)
  updateStoreSettings: async (
    settings: Partial<StoreSettings>
  ): Promise<StoreSettings> => {
    const response = await api.put<StoreSettings>(
      "/settings/admin/store",
      settings
    );
    return response.data;
  },

  // Update notification settings (admin only)
  updateNotificationSettings: async (
    settings: Partial<StoreSettings["notifications"]>
  ): Promise<StoreSettings> => {
    const response = await api.put<StoreSettings>(
      "/settings/admin/notifications",
      settings
    );
    return response.data;
  },

  // Update security settings (admin only)
  updateSecuritySettings: async (
    settings: Partial<StoreSettings["security"]>
  ): Promise<StoreSettings> => {
    const response = await api.put<StoreSettings>(
      "/settings/admin/security",
      settings
    );
    return response.data;
  },

  // Update user preferences
  updateUserPreferences: async (
    preferences: Partial<UserPreferences>
  ): Promise<{ preferences: UserPreferences; message: string }> => {
    const response = await api.put<{
      preferences: UserPreferences;
      message: string;
    }>("/settings/preferences", preferences);
    return response.data;
  },
};

export default settingsService;
