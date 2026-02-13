import api from "./api";
import type { User } from "../../components/Admin/UsersTable";

// Define User interface if not imported, or re-export
// For now, we use the one from UsersTable or define a service-level one
// import { User } from "../../components/Admin/UsersTable";
// But circular dependency might be an issue if UsersTable uses userService.
// UsersTable does NOT use userService directly, AdminDashboard does.
// So we can import User from UsersTable.

const userService = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get("/users?all=true"); // Assuming endpoint supports ?all=true or just /users for admin
      // Check data structure
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      return [];
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (id: string, role: string): Promise<User> => {
    try {
      const response = await api.put(`/users/${id}/role`, { role });
      return response.data;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  // Toggle user status (active/banned)
  toggleUserStatus: async (id: string, status: string): Promise<User> => {
    try {
      // Assuming endpoint, or maybe just update user
      const response = await api.put(`/users/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },
};

export default userService;
