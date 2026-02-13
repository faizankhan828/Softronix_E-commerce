import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Homepage from "./Homepage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { OrderProvider } from "./contexts/OrderContext";
import { AddressProvider } from "./contexts/AddressContext";
import { StoreSettingsProvider } from "./contexts/StoreSettingsContext";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import { initUIFix, fixUI } from "./lib/ui-fix";
import { useScrollToTop } from "./hooks/useScrollToTop";

// Lazy load pages
import { lazy, Suspense } from "react";
const Auth = lazy(() => import("./pages/Auth/Auth"));
const Shop = lazy(() => import("./pages/Shop/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist/Wishlist"));
const Example = lazy(() => import("./pages/Example/Example"));
const AdminDashboard = lazy(() => import("./pages/Admin/Dashboard"));
const AdminOrderDetails = lazy(() => import("./pages/Admin/OrderDetails"));

// Auth pages
const ForgotPassword = lazy(() => import("./features/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./features/auth/ResetPassword"));
// Checkout pages
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const OrderConfirmation = lazy(
  () => import("./pages/Checkout/OrderConfirmation")
);
// Account pages
const Account = lazy(() => import("./pages/Account/Account"));
// OrderDetails component replaced by OrderDetailsPage
const AccountDeactivated = lazy(
  () => import("./components/AccountDeactivated")
);

function App() {
  // Use useLocation to properly detect admin routes
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Scroll to top on route change
  useScrollToTop();

  // Initialize UI fix
  useEffect(() => {
    const { cleanup } = initUIFix();

    // Apply fix immediately
    fixUI();

    // Apply fix on route changes
    const handleRouteChange = () => {
      fixUI();
    };

    // Listen for route changes
    window.addEventListener("popstate", handleRouteChange);

    // Apply fix on key press (Escape)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTimeout(fixUI, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      cleanup();
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900 dark:text-gray-100">
      {/* Hide navbar on admin routes */}
      {location.pathname.indexOf("/admin") !== 0 && <Navbar />}
      <main className={`flex-grow ${isAdminRoute ? "pt-0" : ""}`}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen dark:bg-gray-900 dark:text-gray-100">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3">Loading...</span>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/order-confirmation/:orderId"
              element={<OrderConfirmation />}
            />
            <Route path="/account/*" element={<Account />} />
            {/* Move this inside the Account component's Routes */}
            <Route
              path="/account-deactivated"
              element={<AccountDeactivated />}
            />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route
              path="/admin/orders/:orderId"
              element={<AdminOrderDetails />}
            />
            <Route path="/ui" element={<Example />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {/* Hide footer on admin routes */}
      {location.pathname.indexOf("/admin") !== 0 && <Footer />}
    </div>
  );
}

export default function AppWithProviders() {
  return (
    <ThemeProvider>
      <StoreSettingsProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <OrderProvider>
                <AddressProvider>
                  <App />
                  <Toaster />
                </AddressProvider>
              </OrderProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </StoreSettingsProvider>
    </ThemeProvider>
  );
}
