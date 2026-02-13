import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import settingsService, {
  type StoreSettings,
} from "../api/services/settingsService";
import { useToast } from "../components/ui/use-toast";

// Default store settings
const defaultStoreSettings: StoreSettings = {
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

interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
}

const StoreSettingsContext = createContext<
  StoreSettingsContextType | undefined
>(undefined);

export const StoreSettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getStoreSettings();
      setSettings(data);
    } catch (err) {
      // This should not happen anymore since we have fallback in the service
      console.error("Failed to fetch store settings:", err);
      setError("Failed to load store settings");
      // Use default settings on error
      setSettings(defaultStoreSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      setLoading(true);
      setError(null);

      // Determine which part of settings to update
      if (
        "storeName" in newSettings ||
        "storeEmail" in newSettings ||
        "storePhone" in newSettings ||
        "storeAddress" in newSettings ||
        "currency" in newSettings ||
        "taxRate" in newSettings
      ) {
        try {
          // Update store settings
          const updatedSettings =
            await settingsService.updateStoreSettings(newSettings);
          setSettings((prev) => ({ ...prev, ...updatedSettings }));
        } catch (error: any) {
          if (error?.response?.status === 401) {
            toast({
              title: "Authentication Required",
              description:
                "You must be logged in as an admin to update store settings.",
              variant: "destructive",
            });
            throw error;
          }
          throw error;
        }
      } else if ("stockAlerts" in newSettings) {
        try {
          // Update notification settings
          // Cast to the correct type to fix TypeScript error
          const updatedSettings =
            await settingsService.updateNotificationSettings(
              newSettings as Partial<StoreSettings["notifications"]>,
            );
          setSettings((prev) => ({
            ...prev,
            notifications: {
              ...prev.notifications,
              ...updatedSettings.notifications,
            },
          }));
        } catch (error: any) {
          if (error?.response?.status === 401) {
            toast({
              title: "Authentication Required",
              description:
                "You must be logged in as an admin to update notification settings.",
              variant: "destructive",
            });
            throw error;
          }
          throw error;
        }
      } else if (
        "sessionTimeout" in newSettings ||
        "passwordExpiry" in newSettings
      ) {
        try {
          // Update security settings
          // Cast to the correct type to fix TypeScript error
          const updatedSettings = await settingsService.updateSecuritySettings(
            newSettings as Partial<StoreSettings["security"]>,
          );
          setSettings((prev) => ({
            ...prev,
            security: { ...prev.security, ...updatedSettings.security },
          }));
        } catch (error: any) {
          if (error?.response?.status === 401) {
            toast({
              title: "Authentication Required",
              description:
                "You must be logged in as an admin to update security settings.",
              variant: "destructive",
            });
            throw error;
          }
          throw error;
        }
      }

      toast({
        title: "Settings Updated",
        description: "Store settings have been updated successfully.",
      });
    } catch (err: any) {
      console.error("Failed to update store settings:", err);
      setError("Failed to update store settings");

      // Only show generic error if we haven't shown a specific one
      if (err?.response?.status !== 401) {
        toast({
          title: "Update Failed",
          description: "Failed to update store settings. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useStoreSettings must be used within a StoreSettingsProvider",
    );
  }
  return context;
};

// Helper hooks for specific settings
export const useStoreTaxRate = () => {
  const { settings } = useStoreSettings();
  return settings.taxRate;
};

export const useStoreCurrency = () => {
  const { settings } = useStoreSettings();
  return settings.currency;
};

export const useStoreInfo = () => {
  const { settings } = useStoreSettings();
  return {
    name: settings.storeName,
    email: settings.storeEmail,
    phone: settings.storePhone,
    address: settings.storeAddress,
  };
};
