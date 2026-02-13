import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { StoreProvider } from "./context/StoreContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Store Pages
import { Storefront } from "./pages/Storefront";
import { ProductListing } from "./pages/ProductListing";
import { ProductDetail } from "./pages/ProductDetail";

// Auth & Admin Pages
import Auth from "./pages/Auth";
import VerifyOTP from "./pages/VerifyOTP";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import AdminProducts from "./pages/AdminProducts";
import Checkout from "./pages/Checkout";

// Other Pages
import Todos from "./pages/Todos";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <Router>
            <Routes>
              {/* Store Routes */}
              <Route path="/" element={<Storefront />} />
              <Route path="/shop" element={<ProductListing />} />
              <Route path="/product/:id" element={<ProductDetail />} />

              {/* Auth Routes */}
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <AdminRoute>
                    <AdminProducts />
                  </AdminRoute>
                }
              />

              {/* Checkout Route */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />

              {/* Other Routes */}
              <Route path="/todos" element={<Todos />} />
              <Route path="/success" element={<Success />} />
              <Route path="/cancel" element={<Cancel />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
