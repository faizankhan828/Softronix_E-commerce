import api from "./api";
import cookies from "../../utils/cookies";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  accessToken?: string; // Alternative name for token in some responses
  refreshToken?: string;
  expiresIn?: number;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

// Email verification removed

const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    const { user, token, refreshToken } = response.data;

    // Store auth data in cookies only
    cookies.setAccessToken(token);
    if (refreshToken) {
      cookies.setRefreshToken(refreshToken);
    }
    cookies.setUserData(user);

    return response.data;
  },

  // Login with Google
  loginWithGoogle: async (token: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/google", { token });
    const { user, accessToken, token: authToken } = response.data;

    // Store auth data in cookies only
    const actualToken = accessToken || authToken;
    cookies.setAccessToken(actualToken);
    if (response.data.refreshToken) {
      cookies.setRefreshToken(response.data.refreshToken);
    }
    cookies.setUserData(user);

    return response.data;
  },

  // Login with Facebook
  loginWithFacebook: async (token: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/facebook", { token });
    const { user, accessToken, token: authToken } = response.data;

    // Store auth data in cookies only
    const actualToken = accessToken || authToken;
    cookies.setAccessToken(actualToken);
    if (response.data.refreshToken) {
      cookies.setRefreshToken(response.data.refreshToken);
    }
    cookies.setUserData(user);

    return response.data;
  },

  // Register user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    const { user, token, refreshToken } = response.data;

    // Store auth data in cookies only
    cookies.setAccessToken(token);
    if (refreshToken) {
      cookies.setRefreshToken(refreshToken);
    }
    cookies.setUserData(user);

    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      // Call the server to invalidate the token and clear cookies
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Always clear cookies even if the server request fails
      cookies.clearAuthCookies();
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    // Get user from cookies only
    return cookies.getUserData();
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    // Check cookies only
    return !!cookies.getAccessToken();
  },

  // Request password reset
  forgotPassword: async (
    data: ForgotPasswordData
  ): Promise<{ message: string; token?: string; expires?: Date }> => {
    const response = await api.post<{
      message: string;
      token?: string;
      expires?: Date;
    }>("/auth/forgot-password", data);
    return response.data;
  },

  // Reset password with token
  resetPassword: async (
    data: ResetPasswordData
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/auth/reset-password",
      data
    );
    return response.data;
  },

  // Email verification removed

  // Enable two-factor authentication
  enableTwoFactorAuth: async (): Promise<{
    secret: string;
    qrCodeUrl: string;
  }> => {
    const response = await api.post<{ secret: string; qrCodeUrl: string }>(
      "/auth/2fa/enable"
    );
    return response.data;
  },

  // Verify two-factor authentication
  verifyTwoFactorAuth: async (token: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>("/auth/2fa/verify", {
      token,
    });
    return response.data;
  },

  // Disable two-factor authentication
  disableTwoFactorAuth: async (): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>("/auth/2fa/disable");
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: {
    name?: string;
    email?: string;
  }): Promise<User> => {
    const response = await api.put<User>("/auth/profile", data);

    // Update user in cookies only
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...response.data };
      cookies.setUserData(updatedUser);
    }

    return response.data;
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(
      "/auth/change-password",
      data
    );
    return response.data;
  },

  // Delete account
  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>("/auth/account");
    cookies.clearAuthCookies();
    return response.data;
  },
};

export default authService;
