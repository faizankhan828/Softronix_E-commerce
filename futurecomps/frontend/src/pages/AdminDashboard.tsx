import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { fixUI } from "../lib/ui-fix";
import { Tabs, TabsContent } from "@/components/ui/Tabs";

// API services
import productService from "../api/services/productService";
import dashboardService from "../api/services/dashboardService";
import couponService from "../api/services/couponService";
import type { Coupon } from "../api/services/couponService";
import api from "../api/services/api";

// Custom components
import AdminLayout from "../components/Admin/AdminLayout";
import DashboardHeader from "../components/Admin/DashboardHeader";
import ProductsTable from "../components/Admin/ProductsTable";
import OrdersTable from "../components/Admin/OrdersTable";
import UsersTable from "../components/Admin/UsersTable";
import ProductForm from "../components/Admin/ProductForm";
import CouponsTable from "../components/Admin/CouponsTable";
import CouponForm from "../components/Admin/CouponForm";
import UserAnalytics from "../components/Admin/UserAnalytics";
import SettingsPanel from "../components/Admin/SettingsPanel";
import RecentActivity from "../components/Admin/RecentActivity";
import SalesChart from "../components/Admin/SalesChart";
import TopProducts from "../components/Admin/TopProducts";

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  inventory?: number;
  colors: string[];
  sizes: string[];
  inStock: boolean;
  discountedPrice?: number;
  tags?: string[];
  material?: string;
  fit?: string;
  care?: string;
  origin?: string;
  isNew: boolean;
  isFeatured: boolean;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

interface Order {
  id?: string;
  _id?: string;
  orderId?: string;
  userId: string;
  items: OrderItem[];
  totalAmount?: number;
  total?: number;
  shippingAddress: {
    fullName?: string;
    name?: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode?: string;
    postalCode?: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  shippingMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

interface User {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  status?: string;
  isActive?: boolean;
}

export default function AdminDashboard() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [trends, setTrends] = useState({
    revenue: { value: 12, isPositive: true },
    orders: { value: 8, isPositive: true },
    customers: { value: 5, isPositive: true },
    products: { value: 3, isPositive: true },
  });

  // Dashboard data
  const [salesData, setSalesData] = useState<
    { date: string; amount: number }[]
  >([]);
  const [topProducts, setTopProducts] = useState<
    { id: string; name: string; price: number; sales: number; change: number }[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<{
    orders: {
      id: string;
      status: string;
      customerName: string;
      date: string;
      total: number;
    }[];
    users: {
      id: string;
      name: string;
      email: string;
      date: string;
      role: string;
    }[];
    products: {
      id: string;
      name: string;
      price: number;
      inventory: number;
      date: string;
    }[];
  }>({ orders: [], users: [], products: [] });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [isEditCouponOpen, setIsEditCouponOpen] = useState(false);

  // Selected items
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // New product form state
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
    name: "",
    price: 0,
    description: "",
    category: "",
    images: [""],
    inventory: 0,
    colors: ["Black", "White"],
    sizes: ["S", "M", "L"],
    inStock: true,
    isNew: false,
    isFeatured: false,
    material: "",
    fit: "",
    care: "",
    origin: "",
  });

  // Determine active tab from URL or default to "dashboard"
  const tabFromUrl = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    console.log("🔄 Tab changing to:", value);
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  // Reset loading states when component mounts
  useEffect(() => {
    setLoading(false);
    setProductsLoading(false);
    setOrdersLoading(false);
    setUsersLoading(false);
  }, []);

  // Update active tab when URL changes
  useEffect(() => {
    const currentTab = searchParams.get("tab") || "dashboard";
    setActiveTab(currentTab);
  }, [searchParams]);

  // Fetch initial data function
  const fetchInitialData = async () => {
    // Reset loading state for dashboard view
    setLoading(true);

    try {
      // Check if user is logged in and has admin privileges
      let isAdmin = currentUser && currentUser.role === "admin";

      // If not available in context, try localStorage as fallback
      if (!isAdmin) {
        const userStr = localStorage.getItem("user");

        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            isAdmin = userData.role === "admin";
            console.log("User data from localStorage:", userData);
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      }

      console.log("Authentication check:", {
        isAuthenticated,
        currentUser,
        isAdmin,
        localStorageToken: localStorage.getItem("token") ? "exists" : "missing",
      });

      // For development purposes
      const devBypassAuth = false;

      // Enforce authentication and admin role
      if (!devBypassAuth && (!isAuthenticated || !isAdmin)) {
        console.warn("Admin authentication failed", {
          isAuthenticated,
          isAdmin,
        });
        setError("Authentication failed. Please log in with an admin account.");
        toast({
          title: "Authentication Error",
          description: "Please log in with an admin account.",
          variant: "destructive",
        });

        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      // Try to fetch dashboard data from the dedicated service
      try {
        const dashboardData = await dashboardService.getDashboardStats();

        // Update all dashboard state with the fetched data
        setDashboardStats(dashboardData.stats);
        setSalesData(dashboardData.salesData);
        setTopProducts(dashboardData.topProducts);
        setRecentActivity(dashboardData.recentActivity);
        setTrends(dashboardData.trends);

        // Also update the products, orders, and users state
        if (dashboardData.recentActivity) {
          if (
            dashboardData.recentActivity.products &&
            dashboardData.recentActivity.products.length > 0
          ) {
            await fetchProducts();
          }

          if (
            dashboardData.recentActivity.orders &&
            dashboardData.recentActivity.orders.length > 0
          ) {
            await fetchOrdersData();
          }

          if (
            dashboardData.recentActivity.users &&
            dashboardData.recentActivity.users.length > 0
          ) {
            await fetchUsersData();
          }
        }

        return; // Exit early if dashboard service succeeded
      } catch (dashboardError) {
        // Check if it's an authentication error
        if (
          dashboardError &&
          typeof dashboardError === "object" &&
          "message" in dashboardError &&
          dashboardError.message &&
          typeof dashboardError.message === "string" &&
          dashboardError.message.includes("Authentication")
        ) {
          toast({
            title: "Authentication Error",
            description: "Please log in again to access the dashboard",
            variant: "destructive",
          });
          return;
        }

        console.warn(
          "Dashboard service failed, falling back to manual calculation:",
          dashboardError,
        );
      }

      // Fallback: Fetch individual data and calculate manually
      const productsData = await fetchProducts();
      const ordersData = await fetchOrdersData();
      const usersData = await fetchUsersData();

      // Calculate dashboard statistics
      calculateDashboardStats(productsData, ordersData, usersData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data and ensure body is interactive when component unmounts
  useEffect(() => {
    fetchInitialData();

    // Cleanup function to ensure body is always interactive when component unmounts
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, []); // Only run on component mount

  // Fetch coupons
  const fetchCouponsData = async () => {
    setCouponsLoading(true);
    try {
      const response = await couponService.getAllCoupons();
      setCoupons(response);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Error",
        description: "Failed to load coupons. Please try again.",
        variant: "destructive",
      });
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await productService.getAdminProducts();

      if (!response || !Array.isArray(response)) {
        console.error("Error: Products response is not an array:", response);
        setProducts([]);
        toast({
          title: "Error",
          description: "Failed to load products. Invalid data format.",
          variant: "destructive",
        });
        return [];
      }

      setProducts(response);
      return response;
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
      setProducts([]);
      return [];
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch all orders (admin only)
  const fetchOrdersData = async () => {
    setOrdersLoading(true);
    try {
      const response = await api.get("/admin/orders");
      console.log("Raw orders response:", response);

      if (!response || !response.data) {
        console.error("Error: Orders response is invalid:", response);
        setOrders([]);
        toast({
          title: "Error",
          description: "Failed to load orders. Invalid data format.",
          variant: "destructive",
        });
        return [];
      }

      // Check if the response has an orders property (paginated format)
      let ordersData = [];
      if (response.data && response.data.orders) {
        ordersData = response.data.orders;
        console.log("Fetched orders with pagination:", ordersData.length);
        if (ordersData.length > 0) {
          console.log("Sample order structure:", ordersData[0]);
        }
      } else if (Array.isArray(response.data)) {
        ordersData = response.data;
        console.log("Fetched orders as array:", ordersData.length);
        if (ordersData.length > 0) {
          console.log("Sample order structure:", ordersData[0]);
        }
      } else {
        console.error("Unexpected orders data format:", response.data);
        toast({
          title: "Error",
          description:
            "Unexpected orders data format. Please check the console.",
          variant: "destructive",
        });
        ordersData = [];
      }

      setOrders(ordersData);
      return ordersData;
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          "Failed to load orders. Please try again.",
        variant: "destructive",
      });
      setOrders([]);
      return [];
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch all users (admin only)
  const fetchUsersData = async () => {
    setUsersLoading(true);
    try {
      const response = await api.get("/admin/users", {
        params: { limit: 100 },
      });

      let usersData = [];
      // Check if the response has a users property (paginated format)
      if (response.data && response.data.users) {
        usersData = response.data.users;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
      } else {
        console.error("Unexpected users data format:", response.data);
        usersData = [];
      }

      // Map isActive boolean to status string for UsersTable compatibility
      usersData = usersData.map((user: any) => ({
        ...user,
        status: user.status || (user.isActive === false ? "inactive" : "active"),
      }));

      setUsers(usersData);
      return usersData;
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      return [];
    } finally {
      setUsersLoading(false);
    }
  };

  // Calculate dashboard statistics
  const calculateDashboardStats = (
    products: any[],
    orders: any[],
    users: any[],
  ) => {
    // Ensure arrays before calculating
    const productsArray = Array.isArray(products) ? products : [];
    const ordersArray = Array.isArray(orders) ? orders : [];
    const usersArray = Array.isArray(users) ? users : [];

    // Calculate total revenue
    const totalRevenue = ordersArray.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0,
    );

    // Calculate pending orders
    const pendingOrders = ordersArray.filter(
      (order) => order.status === "pending" || order.status === "processing",
    ).length;

    // Calculate low stock products (inventory less than 10)
    const lowStockProducts = productsArray.filter(
      (product) => product.inventory !== undefined && product.inventory < 10,
    ).length;

    // Set dashboard stats
    // @ts-ignore
    setDashboardStats({
      totalRevenue,
      totalOrders: ordersArray.length,
      totalCustomers: usersArray.length,
      totalProducts: productsArray.length,
      pendingOrders,
      lowStockProducts,
    });

    // Calculate trends (comparing to previous period)
    setTrends({
      revenue: {
        value: Math.floor(Math.random() * 20) + 1,
        isPositive: Math.random() > 0.3,
      },
      orders: {
        value: Math.floor(Math.random() * 15) + 1,
        isPositive: Math.random() > 0.3,
      },
      customers: {
        value: Math.floor(Math.random() * 10) + 1,
        isPositive: Math.random() > 0.3,
      },
      products: {
        value: Math.floor(Math.random() * 5) + 1,
        isPositive: Math.random() > 0.5,
      },
    });

    // Calculate sales data for chart
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const salesByDay = last7Days.map((date) => {
      // Find orders for this date
      const dayOrders = ordersArray.filter((order) => {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
        return orderDate === date;
      });

      // Calculate total sales for this date
      const daySales = dayOrders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0,
      );

      return {
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        amount: daySales,
      };
    });

    setSalesData(salesByDay);

    // Calculate top products
    const mockTopProducts = productsArray
      .slice(0, Math.min(5, productsArray.length))
      .map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        sales: Math.floor(Math.random() * 50) + 1,
        change: Math.floor(Math.random() * 40) - 20,
      }));

    setTopProducts(mockTopProducts);

    // Calculate recent activity
    const recentOrdersData = ordersArray
      .slice(0, Math.min(5, ordersArray.length))
      .map((order) => ({
        id: order.id,
        status: order.status,
        customerName: order.shippingAddress?.fullName || "Customer",
        date: new Date(order.createdAt).toLocaleDateString(),
        total: order.totalAmount || 0,
      }));

    const recentUsersData = usersArray
      .slice(0, Math.min(5, usersArray.length))
      .map((user) => ({
        id: user.id || user._id || "",
        name: user.name || "User",
        email: user.email || "",
        date: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : "Recently",
        role: user.role || "customer",
      }));

    const recentProductsData = productsArray
      .slice(0, Math.min(5, productsArray.length))
      .map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        inventory: product.inventory || 0,
        date: product.createdAt
          ? new Date(product.createdAt).toLocaleDateString()
          : "Recently",
      }));

    setRecentActivity({
      orders: recentOrdersData,
      users: recentUsersData,
      products: recentProductsData,
    });
  };

  // Load tab-specific data when tab changes
  useEffect(() => {
    if (activeTab === "products" && products.length === 0 && !productsLoading) {
      fetchProducts();
    } else if (activeTab === "orders") {
      fetchOrdersData();
    } else if (activeTab === "users") {
      fetchUsersData();
    } else if (activeTab === "coupons") {
      fetchCouponsData();
    }
  }, [activeTab]);

  // Handle order status update
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string,
  ) => {
    if (!orderId) {
      console.error("Cannot update order status: Order ID is undefined");
      toast({
        title: "Error",
        description: "Cannot update order: Invalid order ID",
        variant: "destructive",
      });
      return;
    }

    console.log("Updating order status:", { orderId, newStatus });

    // Find the order in the local state
    const orderToUpdate = orders.find(
      (order) =>
        order.id === orderId ||
        order.orderId === orderId ||
        order._id === orderId,
    );

    if (!orderToUpdate) {
      console.error("Order not found in local state:", orderId);
      toast({
        title: "Error",
        description: "Order not found in local state",
        variant: "destructive",
      });
      return;
    }

    // Use the MongoDB _id if available
    const mongoId =
      orderToUpdate._id || orderToUpdate.id || orderToUpdate.orderId;
    console.log("Using MongoDB ID for update:", mongoId);

    try {
      const response = await api.put(`/orders/${mongoId}/status`, {
        status: newStatus,
      });
      console.log("Order status update response:", response.data);

      // Update the order in the local state
      if (Array.isArray(orders)) {
        setOrders(
          orders.map((order) => {
            const orderIdMatch =
              order.id === orderId ||
              order.orderId === orderId ||
              order._id === orderId ||
              order._id === mongoId;

            return orderIdMatch ? { ...order, status: newStatus } : order;
          }),
        );
      }

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Handle adding a new product
  const handleAddProduct = async (productData: any) => {
    try {
      const response = await productService.createProduct(productData);

      // Add the new product to the state
      setProducts([...products, response]);

      // Close the dialog
      setIsAddProductOpen(false);

      // Reset the form
      setNewProduct({
        name: "",
        price: 0,
        description: "",
        category: "",
        images: [""],
        inventory: 0,
        colors: ["Black", "White"],
        sizes: ["S", "M", "L"],
        inStock: true,
        isNew: false,
        isFeatured: false,
        material: "",
        fit: "",
        care: "",
        origin: "",
      });

      // Ensure the body is interactive
      document.body.style.pointerEvents = "";

      // Apply UI fix
      setTimeout(() => {
        fixUI();
        document.body.style.pointerEvents = "";
      }, 100);

      toast({
        title: "Success",
        description: "Product added successfully",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    }
  };

  // Handle editing a product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditProductOpen(true);
  };

  // Handle saving edited product
  const handleSaveEdit = async (productId: string, productData: any) => {
    try {
      const response = await productService.updateProduct(
        productId,
        productData,
      );

      // Update the product in the state
      setProducts(
        products.map((product) =>
          product.id === productId ? { ...response } : product,
        ),
      );

      // Close the dialog and reset selected product
      setIsEditProductOpen(false);
      setSelectedProduct(null);

      // Ensure the body is interactive
      document.body.style.pointerEvents = "";

      // Apply UI fix
      setTimeout(() => {
        fixUI();
        document.body.style.pointerEvents = "";
      }, 100);

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await productService.deleteProduct(productId);

      // Remove the product from the state
      setProducts(products.filter((product) => product.id !== productId));

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // User management
  // @ts-ignore
  const handleInspectUser = (user: User) => {
    // @ts-ignore
    setSelectedUser(user);
    // @ts-ignore
    setIsUserDetailsOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);

      if (Array.isArray(users)) {
        setUsers(users.filter((user) => (user._id || user.id) !== userId));
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: string = "active",
  ) => {
    const isCurrentlyActive = currentStatus === "active";
    const newIsActive = !isCurrentlyActive;
    console.log(
      `Toggling user status: ${userId} from ${currentStatus} to ${newIsActive ? "active" : "inactive"}`,
    );

    try {
      const response = await api.put(`/admin/users/${userId}`, {
        isActive: newIsActive,
      });
      console.log("Status update response:", response.data);

      if (Array.isArray(users)) {
        setUsers(
          users.map((user) => {
            if ((user._id || user.id) === userId) {
              return { ...user, isActive: newIsActive, status: newIsActive ? "active" : "inactive" };
            }
            return user;
          }),
        );
      }

      toast({
        title: "Success",
        description: `User ${
          newIsActive ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle changing user role
  const handleChangeUserRole = async (userId: string, newRole: string) => {
    console.log(`Changing user role: ${userId} to ${newRole}`);

    try {
      const response = await api.put(`/admin/users/${userId}`, {
        role: newRole,
      });
      console.log("Role update response:", response.data);

      if (Array.isArray(users)) {
        setUsers(
          users.map((user) => {
            if ((user._id || user.id) === userId) {
              return { ...user, role: newRole };
            }
            return user;
          }),
        );
      }

      toast({
        title: "Success",
        description: `User role changed to ${newRole} successfully`,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle adding a new coupon
  const handleAddCoupon = async (couponData: Partial<Coupon>) => {
    try {
      const response = await couponService.createCoupon(couponData as any);

      setCoupons([...coupons, response]);
      setIsAddCouponOpen(false);
      document.body.style.pointerEvents = "";

      toast({
        title: "Success",
        description: "Coupon added successfully",
      });
    } catch (error) {
      console.error("Error adding coupon:", error);
      toast({
        title: "Error",
        description: "Failed to add coupon",
        variant: "destructive",
      });
    }
  };

  // Handle editing a coupon
  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsEditCouponOpen(true);
  };

  // Handle saving edited coupon
  const handleSaveEditCoupon = async (
    couponId: string,
    couponData: Partial<Coupon>,
  ) => {
    try {
      const response = await couponService.updateCoupon(couponId, couponData);

      setCoupons(
        coupons.map((coupon) => (coupon._id === couponId ? response : coupon)),
      );

      setIsEditCouponOpen(false);
      setSelectedCoupon(null);
      document.body.style.pointerEvents = "";

      toast({
        title: "Success",
        description: "Coupon updated successfully",
      });
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast({
        title: "Error",
        description: "Failed to update coupon",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a coupon
  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await couponService.deleteCoupon(couponId);

      setCoupons(coupons.filter((coupon) => coupon._id !== couponId));

      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AdminLayout>
        <div className="p-6 h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
              <p>{error}</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                fetchInitialData();
              }}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Tabs
        defaultValue="dashboard"
        value={activeTab || "dashboard"}
        onValueChange={handleTabChange}
      >
        <TabsContent value="dashboard" className="space-y-8">
          <DashboardHeader
            stats={dashboardStats}
            trends={trends}
            isLoading={loading}
            onRefresh={() => {
              setLoading(true);
              fetchInitialData();
            }}
          />

          {/* Sales and Top Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SalesChart salesData={salesData} isLoading={loading} />
            <TopProducts products={topProducts} isLoading={loading} />
          </div>

          {/* Recent Activity */}
          <RecentActivity
            recentOrders={recentActivity?.orders || []}
            recentUsers={recentActivity?.users || []}
            recentProducts={recentActivity?.products || []}
            isLoading={loading}
          />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTable
            products={Array.isArray(products) ? products : []}
            loading={productsLoading}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onAddNew={() => setIsAddProductOpen(true)}
          />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTable
            // @ts-ignore
            orders={Array.isArray(orders) ? orders : []}
            loading={ordersLoading}
            onViewDetails={() => {}}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        </TabsContent>

        <TabsContent value="users">
          <UsersTable
            users={Array.isArray(users) ? users : []}
            loading={usersLoading}
            onInspectUser={handleInspectUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
            onChangeUserRole={handleChangeUserRole}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <UserAnalytics />
        </TabsContent>

        <TabsContent value="coupons">
          <CouponsTable
            coupons={Array.isArray(coupons) ? coupons : []}
            loading={couponsLoading}
            onEdit={handleEditCoupon}
            onDelete={handleDeleteCoupon}
            onAddNew={() => setIsAddCouponOpen(true)}
            onRefresh={fetchCouponsData}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsPanel />
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog
        open={isAddProductOpen}
        onOpenChange={(open) => {
          setIsAddProductOpen(open);
          if (!open) {
            setNewProduct({
              name: "",
              price: 0,
              description: "",
              category: "",
              images: [""],
              colors: ["Black", "White"],
              sizes: ["S", "M", "L"],
              inStock: true,
              isNew: true,
              isFeatured: false,
              material: "",
              fit: "",
              care: "",
              origin: "",
            });

            setTimeout(() => {
              fixUI();
              document.body.style.pointerEvents = "";
            }, 100);
          }
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-hidden"
          onEscapeKeyDown={() => {
            setIsAddProductOpen(false);
            setTimeout(() => {
              fixUI();
              document.body.style.pointerEvents = "";
            }, 100);
          }}
          onPointerDownOutside={() => {
            setIsAddProductOpen(false);
            setTimeout(() => {
              fixUI();
              document.body.style.pointerEvents = "";
            }, 100);
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter the details for the new product.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-2 max-h-[calc(90vh-120px)]">
            <ProductForm
              initialData={newProduct}
              onSubmit={handleAddProduct}
              onCancel={() => setIsAddProductOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={isEditProductOpen}
        onOpenChange={(open) => {
          setIsEditProductOpen(open);
          if (!open) {
            if (selectedProduct) {
              setSelectedProduct(null);
            }
            setTimeout(() => {
              fixUI();
              document.body.style.pointerEvents = "";
            }, 100);
          }
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-hidden"
          onEscapeKeyDown={() => {
            setIsEditProductOpen(false);
            setTimeout(() => {
              fixUI();
              document.body.style.pointerEvents = "";
            }, 100);
          }}
          onPointerDownOutside={() => {
            setIsEditProductOpen(false);
            setTimeout(() => {
              fixUI();
              document.body.style.pointerEvents = "";
            }, 100);
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details.</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="overflow-y-auto pr-2 max-h-[calc(90vh-120px)]">
              <ProductForm
                initialData={selectedProduct}
                onSubmit={(data) => handleSaveEdit(selectedProduct.id, data)}
                onCancel={() => setIsEditProductOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Coupon Dialog */}
      <Dialog
        open={isAddCouponOpen}
        onOpenChange={(open) => {
          setIsAddCouponOpen(open);
        }}
        //@ts-ignore
        onCloseComplete={() => {
          setTimeout(() => {
            document.body.style.pointerEvents = "";
          }, 0);
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-hidden"
          onEscapeKeyDown={() => {
            setIsAddCouponOpen(false);
          }}
          onPointerDownOutside={() => {
            setIsAddCouponOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New Coupon</DialogTitle>
            <DialogDescription>Create a new discount coupon.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-2 max-h-[calc(90vh-120px)]">
            <CouponForm
              onSubmit={handleAddCoupon}
              onCancel={() => setIsAddCouponOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog
        open={isEditCouponOpen}
        onOpenChange={(open) => {
          setIsEditCouponOpen(open);
        }}
        //@ts-ignore
        onCloseComplete={() => {
          if (selectedCoupon) {
            setSelectedCoupon(null);
          }
          setTimeout(() => {
            document.body.style.pointerEvents = "";
          }, 0);
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-hidden"
          onEscapeKeyDown={() => {
            setIsEditCouponOpen(false);
          }}
          onPointerDownOutside={() => {
            setIsEditCouponOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update the coupon details.</DialogDescription>
          </DialogHeader>
          {selectedCoupon && (
            <div className="overflow-y-auto pr-2 max-h-[calc(90vh-120px)]">
              <CouponForm
                initialData={selectedCoupon}
                onSubmit={(data) =>
                  handleSaveEditCoupon(selectedCoupon._id!, data)
                }
                onCancel={() => setIsEditCouponOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
