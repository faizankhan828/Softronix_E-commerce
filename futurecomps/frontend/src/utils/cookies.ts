import Cookies from "js-cookie";

// Cookie names
const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";
const USER_COOKIE = "user_data";
const CSRF_TOKEN_COOKIE = "csrf_token";

// Cookie options
const cookieOptions = {
  expires: 7, // 7 days
  path: "/",
  secure:
    process.env.NODE_ENV === "production" ||
    window.location.protocol === "https:",
  sameSite: "strict" as const,
};

// Short-lived cookie options (for access token)
const shortCookieOptions = {
  ...cookieOptions,
  expires: 1, // 1 day
};

// CSRF token options
const csrfCookieOptions = {
  ...cookieOptions,
  expires: 1, // 1 day
  // Not HTTP-only so JavaScript can access it
  httpOnly: false,
};

/**
 * Set the access token in a cookie
 */
export const setAccessToken = (token: string): void => {
  Cookies.set(ACCESS_TOKEN_COOKIE, token, shortCookieOptions);
};

/**
 * Get the access token from the cookie
 */
export const getAccessToken = (): string | undefined => {
  return Cookies.get(ACCESS_TOKEN_COOKIE);
};

/**
 * Set the refresh token in a cookie
 */
export const setRefreshToken = (token: string): void => {
  Cookies.set(REFRESH_TOKEN_COOKIE, token, cookieOptions);
};

/**
 * Get the refresh token from the cookie
 */
export const getRefreshToken = (): string | undefined => {
  return Cookies.get(REFRESH_TOKEN_COOKIE);
};

/**
 * Set the user data in a cookie
 */
export const setUserData = (user: any): void => {
  Cookies.set(USER_COOKIE, JSON.stringify(user), cookieOptions);
};

/**
 * Get the user data from the cookie
 */
export const getUserData = (): any => {
  const userData = Cookies.get(USER_COOKIE);
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error("Error parsing user data from cookie:", e);
      return null;
    }
  }
  return null;
};

/**
 * Clear all authentication cookies
 */
export const clearAuthCookies = (): void => {
  Cookies.remove(ACCESS_TOKEN_COOKIE, { path: "/" });
  Cookies.remove(REFRESH_TOKEN_COOKIE, { path: "/" });
  Cookies.remove(USER_COOKIE, { path: "/" });
  Cookies.remove(CSRF_TOKEN_COOKIE, { path: "/" });
};

/**
 * Clear account deactivation flag from session storage
 */
export const clearDeactivationFlag = (): void => {
  sessionStorage.removeItem("accountDeactivated");
};

/**
 * Generate a CSRF token
 */
export const generateCsrfToken = (): string => {
  // Generate a random token
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Store it in a cookie
  Cookies.set(CSRF_TOKEN_COOKIE, token, csrfCookieOptions);

  return token;
};

/**
 * Get the CSRF token from the cookie
 */
export const getCsrfToken = (): string | undefined => {
  const token = Cookies.get(CSRF_TOKEN_COOKIE);

  // If no token exists, generate a new one
  if (!token) {
    return generateCsrfToken();
  }

  return token;
};

export default {
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  setUserData,
  getUserData,
  clearAuthCookies,
  clearDeactivationFlag,
  generateCsrfToken,
  getCsrfToken,
};
