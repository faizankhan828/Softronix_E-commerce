import axios from "axios";
import type { AxiosInstance } from "axios";
import cookies from "../../utils/cookies";

// Add a global flag to track if we're currently refreshing the token
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Add a circuit breaker to prevent infinite refresh loops
let refreshFailCount = 0;
const MAX_REFRESH_ATTEMPTS = 3;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN_MS = 5000; // 5 seconds cooldown between refresh attempts

// Function to add callbacks to the subscriber list
const subscribeToTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Function to notify all subscribers with the new token
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Function to notify all subscribers about a refresh failure
const onTokenRefreshFailed = () => {
  refreshSubscribers.forEach((callback) => callback(""));
  refreshSubscribers = [];
};

// Create Axios instance with config
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://serverk-ochre.vercel.app/api", // Use environment variable
  timeout: 15000, // 15 seconds timeout - increased from 8 seconds
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Using token-based auth, not cookies
}) as AxiosInstance & {
  checkApiAvailability: () => Promise<boolean>;
};

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Get the token from cookies only
    const token: string | undefined = cookies.getAccessToken();

    // Debug log for admin routes
    if (config.url?.includes("/admin")) {
      console.log("🔑 Admin request:", config.url, "Token present:", !!token);
    }

    // Always attach the token if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token to all non-GET requests
    if (config.method !== "get") {
      const csrfToken = cookies.getCsrfToken();
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }

    // For admin routes, add timestamp to prevent caching
    if (
      config.url?.includes("/admin") ||
      config.params?.admin ||
      config.url?.includes("/stats/")
    ) {
      config.params = { ...config.params, _t: Date.now() };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If there's no config, we can't retry - just reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // No need to log API errors

    // Handle account deactivation (403 with deactivated flag)
    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data?.deactivated
    ) {
      // Account deactivated, redirecting to deactivation page

      // Check if we've already been redirected to prevent loops
      const isDeactivationRedirect =
        sessionStorage.getItem("accountDeactivated");
      const isOnDeactivatedPage = window.location.pathname.includes(
        "/account-deactivated",
      );

      // Only redirect if we haven't been redirected before and aren't already on the page
      if (!isDeactivationRedirect && !isOnDeactivatedPage) {
        // Clear auth cookies
        cookies.clearAuthCookies();

        // Get the email from local storage or cookies if available
        const userData = cookies.getUserData();
        const email = userData?.email;

        // Set the flag to prevent future redirects in this session
        sessionStorage.setItem("accountDeactivated", "true");

        // Redirect to account deactivated page
        window.location.href = `/account-deactivated${
          email ? `?email=${encodeURIComponent(email)}` : ""
        }`;
      }

      return Promise.reject(error);
    }

    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Check if we have a token - if we do, don't try to refresh or redirect
      const token = cookies.getAccessToken();

      // If we have a token but still got 401, it means the token is invalid
      // Don't create a redirect loop - just reject the error
      if (token && window.location.pathname.includes("/admin")) {
        console.error("Admin API call failed with 401 despite having token");
        return Promise.reject(error);
      }

      // Check if we should attempt to refresh the token
      const now = Date.now();
      const shouldAttemptRefresh =
        originalRequest &&
        !originalRequest._retry &&
        refreshFailCount < MAX_REFRESH_ATTEMPTS &&
        now - lastRefreshTime > REFRESH_COOLDOWN_MS;

      if (shouldAttemptRefresh && originalRequest) {
        originalRequest._retry = true;

        // If we're already refreshing, add this request to subscribers
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeToTokenRefresh((token: string) => {
              if (token && originalRequest) {
                if (!originalRequest.headers) {
                  originalRequest.headers = {};
                }
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(axios(originalRequest));
              } else {
                reject(error);
              }
            });
          });
        }

        // Set refreshing flag
        isRefreshing = true;
        lastRefreshTime = now;

        try {
          // Try to refresh the token
          const newToken = await refreshAccessToken();

          // Reset fail count on success
          refreshFailCount = 0;
          isRefreshing = false;

          // If successful, retry the original request and notify subscribers
          if (newToken && originalRequest) {
            if (!originalRequest.headers) {
              originalRequest.headers = {};
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            onTokenRefreshed(newToken);
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // Increment fail count
          refreshFailCount++;
          isRefreshing = false;

          // If refresh fails, clear auth data and redirect
          cookies.clearAuthCookies();
          onTokenRefreshFailed();

          // Don't redirect if already on the auth page to prevent redirect loops
          if (
            !window.location.pathname.includes("/auth") &&
            !window.location.pathname.includes("/login")
          ) {
            // Save the current path to redirect back after login
            const currentPath =
              window.location.pathname + window.location.search;
            window.location.href = `/auth?redirectTo=${encodeURIComponent(
              currentPath,
            )}`;
          }

          return Promise.reject(refreshError);
        }
      } else if (refreshFailCount >= MAX_REFRESH_ATTEMPTS) {
        // We've exceeded the maximum refresh attempts
        cookies.clearAuthCookies();

        // Don't redirect if already on the auth page
        if (
          !window.location.pathname.includes("/auth") &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/auth?error=session_expired";
        }
      } else {
        // Clear auth data and redirect to login if unauthorized and refresh already failed
        cookies.clearAuthCookies();

        // Don't redirect if already on the auth page to prevent redirect loops
        if (
          !window.location.pathname.includes("/auth") &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/auth";
        }
      }
    }

    // Skip logging for API errors

    return Promise.reject(error);
  },
);

// Helper method to check API availability
api.checkApiAvailability = async () => {
  try {
    const response = await api.get("/");
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

/**
 * Refresh the access token using the refresh token
 * @returns {Promise<string>} New access token
 */
export const refreshAccessToken = async (): Promise<string> => {
  try {
    // Use a separate axios instance to avoid interceptor loops
    const refreshAxios = axios.create({
      baseURL: api.defaults.baseURL,
      timeout: 5000,
      withCredentials: false, // Using token-based auth
    });

    // Get refresh token from cookies
    const refreshToken = cookies.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await refreshAxios.post("/auth/refresh-token", {
      refreshToken,
    });

    const { token, newRefreshToken } = response.data;

    if (token) {
      // Update token in cookies
      cookies.setAccessToken(token);
      if (newRefreshToken) {
        cookies.setRefreshToken(newRefreshToken);
      }

      // Update the user object in cookies
      const cookieUser = cookies.getUserData();
      if (cookieUser) {
        // Update cookie user
        const updatedUser = {
          ...cookieUser,
          token,
          refreshToken: newRefreshToken || cookieUser.refreshToken,
        };
        cookies.setUserData(updatedUser);
      }

      return token;
    } else {
      throw new Error("No token received from refresh endpoint");
    }
  } catch (error) {
    // Clear auth data on refresh failure
    cookies.clearAuthCookies();
    throw error;
  } finally {
    // Reset the refreshing flag regardless of outcome
    isRefreshing = false;
  }
};

export default api;
