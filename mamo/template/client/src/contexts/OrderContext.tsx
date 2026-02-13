import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  getOrders,
  getOrderById,
  cancelOrder,
  Order,
} from "../api/services/orderService";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "./AuthContext";

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  getOrder: (id: string) => Promise<Order | null>;
  cancelUserOrder: (id: string) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch from API first
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Error fetching orders from API:", err);

      // Just show the error, don't use mock data
      setOrders([]);
      setError("Failed to fetch orders from API. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const getOrder = useCallback(
    async (id: string): Promise<Order | null> => {
      setIsLoading(true);
      setError(null);

      // Try the API to get the order
      if (!isAuthenticated) {
        console.warn("User not authenticated, but proceeding with order fetch");
      }

      // Try to get the order from the API
      try {
        const order = await getOrderById(id);
        console.log("Order fetched from API:", order);
        return order;
      } catch (apiError) {
        console.error(`Error fetching order from API:`, apiError);

        // Order not found or other API error
        console.error("Error fetching order from API");
        setError("Order not found. Please check the order ID and try again.");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user]
  );

  const cancelUserOrder = useCallback(
    async (id: string): Promise<boolean> => {
      if (!isAuthenticated) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to cancel an order.",
          variant: "destructive",
        });
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Call the API to cancel the order
        await cancelOrder(id);

        // Update local orders state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === id ? { ...order, status: "cancelled" } : order
          )
        );

        toast({
          title: "Success",
          description: `Order #${id} has been cancelled successfully.`,
        });

        return true;
      } catch (err) {
        setError(`Failed to cancel order #${id}. Please try again later.`);
        toast({
          title: "Error",
          description: `Failed to cancel order #${id}. Please try again later.`,
          variant: "destructive",
        });
        console.error(`Error cancelling order #${id}:`, err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, orders, toast]
  );

  // Initial load of orders
  useEffect(() => {
    // Only load orders if authenticated
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  const value = {
    orders,
    isLoading,
    error,
    fetchOrders,
    getOrder,
    cancelUserOrder,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};
