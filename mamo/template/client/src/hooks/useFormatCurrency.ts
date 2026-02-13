import { useCallback, useState, useEffect } from "react";
import { formatCurrency } from "../lib/utils";
import settingsService from "../api/services/settingsService";

/**
 * Hook to format currency values using the store's currency setting
 * @returns A function that formats a number as currency
 */
export function useFormatCurrency() {
  // Default currency
  const [currency, setCurrency] = useState("USD");

  // Fetch settings on hook mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.getStoreSettings();
        setCurrency(settings.currency);
      } catch (error) {
        console.warn("Failed to fetch currency settings, using default");
      }
    };

    fetchSettings();
  }, []);

  const format = useCallback(
    (amount: number) => {
      return formatCurrency(amount, currency);
    },
    [currency]
  );

  return format;
}
