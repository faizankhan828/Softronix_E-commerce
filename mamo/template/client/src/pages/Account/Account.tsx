import React, { useState } from "react";
import { useNavigate, Routes, Route, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";

import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Orders from "./Orders";
import ProfileSettings from "./ProfileSettings";
import OrderDetailsPage from "./OrderDetailsPage";
import { useToast } from "@/components/ui/use-toast";

export default function Account() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to access your account",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isAuthenticated, navigate, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading account information...
          </p>
        </div>
      </div>
    );
  }

  // Sidebar content component
  const SidebarContent = () => (
    <div className="bg-card rounded-lg shadow p-4 sm:p-6 h-fit">
      <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm sm:text-base truncate">
            {user.name || user.email}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
      </div>

      <Separator className="mb-4 sm:mb-6" />

      <nav className="space-y-1">
        <Link
          to="/account/orders"
          className={`flex items-center py-2 px-3 rounded-md w-full text-sm ${
            activeTab === "orders"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => {
            setActiveTab("orders");
            setSidebarOpen(false);
          }}
        >
          <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span>Orders</span>
        </Link>

        <Link
          to="/account/wishlist"
          className={`flex items-center py-2 px-3 rounded-md w-full text-sm ${
            activeTab === "wishlist"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => {
            setActiveTab("wishlist");
            setSidebarOpen(false);
          }}
        >
          <Heart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span>Wishlist</span>
        </Link>

        <Link
          to="/account/addresses"
          className={`flex items-center py-2 px-3 rounded-md w-full text-sm ${
            activeTab === "addresses"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => {
            setActiveTab("addresses");
            setSidebarOpen(false);
          }}
        >
          <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span>Addresses</span>
        </Link>

        <Link
          to="/account/payment"
          className={`flex items-center py-2 px-3 rounded-md w-full text-sm ${
            activeTab === "payment"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => {
            setActiveTab("payment");
            setSidebarOpen(false);
          }}
        >
          <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span>Payment Methods</span>
        </Link>

        <Link
          to="/account/settings"
          className={`flex items-center py-2 px-3 rounded-md w-full text-sm ${
            activeTab === "settings"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => {
            setActiveTab("settings");
            setSidebarOpen(false);
          }}
        >
          <Settings className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span>Settings</span>
        </Link>

        <Separator className="my-2" />

        <Button
          variant="ghost"
          className="w-full justify-start text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span>Logout</span>
        </Button>
      </nav>
    </div>
  );

  return (
    <div className="container mx-auto p-3 sm:p-6">
      {/* Mobile Header */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">My Account</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4 mr-2" />
            Menu
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Account Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg shadow p-4 sm:p-6 min-h-[400px]">
            <Routes>
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderId" element={<OrderDetailsPage />} />
              <Route path="settings" element={<ProfileSettings />} />
              <Route
                path="wishlist"
                element={
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Wishlist</h3>
                    <p className="text-muted-foreground">
                      Your wishlist items will appear here.
                    </p>
                  </div>
                }
              />
              <Route
                path="addresses"
                element={
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Addresses</h3>
                    <p className="text-muted-foreground">
                      Manage your delivery addresses.
                    </p>
                  </div>
                }
              />
              <Route
                path="payment"
                element={
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Payment Methods
                    </h3>
                    <p className="text-muted-foreground">
                      Manage your payment methods.
                    </p>
                  </div>
                }
              />
              <Route path="" element={<Orders />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
