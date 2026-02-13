import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import authService, {
  User,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
} from "../api/services/authService";
import { refreshAccessToken } from "../api/services/api";
// These services are not used in this file
// import cartService from "../api/services/cartService";
// import wishlistService from "../api/services/wishlistService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  loginWithFacebook: (token: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (
    data: ForgotPasswordData
  ) => Promise<{ message: string; token?: string; expires?: Date }>;
  resetPassword: (data: ResetPasswordData) => Promise<{ message: string }>;
  // Email verification removed
  enableTwoFactorAuth: () => Promise<{ secret: string; qrCodeUrl: string }>;
  verifyTwoFactorAuth: (token: string) => Promise<{ success: boolean }>;
  disableTwoFactorAuth: () => Promise<{ success: boolean }>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<User>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ message: string }>;
  deleteAccount: () => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<number | null>(null);

  // Function to set up token refresh
  const setupTokenRefresh = () => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    // Set timer to refresh token 5 minutes before expiration (55 minutes after setting)
    refreshTimerRef.current = window.setTimeout(async () => {
      try {
        if (user) {
          await refreshAccessToken();
          // Reset the timer after successful refresh
          setupTokenRefresh();
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        // If refresh fails, log the user out
        logout();
      }
    }, 55 * 60 * 1000); // 55 minutes
  };

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      // Set up token refresh if user is logged in
      setupTokenRefresh();
    }
    setLoading(false);

    // Clean up timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);

    // Set up token refresh after successful login
    setupTokenRefresh();

    // Sync cart and wishlist after login
    try {
      // Import services here to avoid circular dependencies
      const cartService = (await import("../api/services/cartService")).default;
      const wishlistService = (await import("../api/services/wishlistService"))
        .default;

      // Sync cart and wishlist from local storage to server
      await cartService.syncCartAfterLogin();
      await wishlistService.syncWishlistAfterLogin();
    } catch (error) {
      console.error("Error syncing cart/wishlist after login:", error);
    }
  };

  const loginWithGoogle = async (token: string) => {
    const response = await authService.loginWithGoogle(token);
    setUser(response.user);
    // Set up token refresh after successful login
    setupTokenRefresh();
  };

  const loginWithFacebook = async (token: string) => {
    const response = await authService.loginWithFacebook(token);
    setUser(response.user);
    // Set up token refresh after successful login
    setupTokenRefresh();
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    setUser(response.user);
    // Set up token refresh after successful registration
    setupTokenRefresh();
  };

  const logout = async () => {
    try {
      // Clear token refresh timer
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
      // Still clear the user state even if the server request fails
      setUser(null);
    }
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    return await authService.forgotPassword(data);
  };

  const resetPassword = async (data: ResetPasswordData) => {
    return await authService.resetPassword(data);
  };

  // Email verification removed

  const enableTwoFactorAuth = async () => {
    return await authService.enableTwoFactorAuth();
  };

  const verifyTwoFactorAuth = async (token: string) => {
    return await authService.verifyTwoFactorAuth(token);
  };

  const disableTwoFactorAuth = async () => {
    return await authService.disableTwoFactorAuth();
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    return await authService.changePassword(data);
  };

  const deleteAccount = async () => {
    const result = await authService.deleteAccount();
    setUser(null);
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        loginWithFacebook,
        register,
        logout,
        forgotPassword,
        resetPassword,
        // Email verification removed
        enableTwoFactorAuth,
        verifyTwoFactorAuth,
        disableTwoFactorAuth,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
