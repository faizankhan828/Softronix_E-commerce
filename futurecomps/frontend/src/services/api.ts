import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),

  verifyOTP: (data: { email: string; otp: string }) =>
    api.post("/auth/verify-otp", data),

  resendOTP: (data: { email: string }) => api.post("/auth/resend-otp", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  forgotPassword: (data: { email: string }) =>
    api.post("/auth/forgot-password", data),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post("/auth/reset-password", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),

  getMe: () => api.get("/auth/me"),
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get("/profile"),

  updateProfile: (data: {
    name?: string;
    phone?: string;
    bio?: string;
    avatar?: string;
  }) => api.put("/profile", data),

  deleteAccount: (data: { password: string }) =>
    api.delete("/profile", { data }),

  getStats: () => api.get("/profile/stats"),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append("image", file);
    if (folder) {
      formData.append("folder", folder);
    }
    return api.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getAuthParameters: () => api.get("/upload/auth"),

  deleteImage: (fileId: string) => api.delete(`/upload/${fileId}`),
};

// Admin API
export const adminAPI = {
  // User management
  getAllUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: string;
  }) => api.get("/admin/users", { params }),

  getUserById: (id: string) => api.get(`/admin/users/${id}`),

  updateUser: (
    id: string,
    data: {
      role?: string;
      isActive?: boolean;
      isVerified?: boolean;
      name?: string;
      email?: string;
      phone?: string;
      bio?: string;
    },
  ) => api.put(`/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  bulkUpdateUsers: (data: {
    userIds: string[];
    action: "activate" | "deactivate" | "verify" | "delete";
  }) => api.post("/admin/users/bulk-update", data),

  // Statistics
  getStats: () => api.get("/admin/stats"),
};

export default api;
