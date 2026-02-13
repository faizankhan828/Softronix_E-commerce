import api from "./api";

export interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  imageUrl?: string;
  category: string;
  colors: string[];
  sizes: string[];
  inStock: boolean;
  stock?: number;
  isNew: boolean;
  isFeatured: boolean;
  rating?: number;
  reviews?: Review[];
  material?: string;
  fit?: string;
  care?: string;
  origin?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const productService = {
  // Get all products
  getProducts: async (params?: {
    category?: string;
    search?: string;
    sort?: string;
    limit?: number;
    page?: number;
    admin?: boolean;
  }): Promise<{ products: Product[]; total: number }> => {
    try {
      const response = await api.get("/products", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all product categories
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await api.get("/products/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await api.get(`/products/${id}`);

      if (!response.data) {
        throw new Error("No product data returned from API");
      }

      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get featured products
  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      const response = await api.get("/products/featured");
      return response.data;
    } catch (error) {
      console.error("Error in getFeaturedProducts:", error);
      throw error;
    }
  },

  // Get new arrivals
  getNewArrivals: async (count?: number): Promise<Product[]> => {
    try {
      const response = await api.get("/products/new-arrivals", {
        params: count ? { limit: count } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error("Error in getNewArrivals:", error);
      throw error;
    }
  },

  // Search products
  searchProducts: async (query: string): Promise<Product[]> => {
    try {
      const response = await api.get("/products/search", { params: { query } });
      return response.data;
    } catch (error) {
      console.error("Error in searchProducts:", error);
      throw error;
    }
  },

  // Admin: Get all products for admin dashboard
  getAdminProducts: async (): Promise<Product[]> => {
    try {
      const response = await api.get("/products", { params: { admin: true } });

      // Make sure we return an array, even if the response is malformed
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (
        response.data &&
        response.data.products &&
        Array.isArray(response.data.products)
      ) {
        return response.data.products;
      } else {
        console.error("Unexpected response format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error in getAdminProducts:", error);
      return [];
    }
  },

  // Admin: Create new product
  createProduct: async (productData: Omit<Product, "id">): Promise<Product> => {
    try {
      const response = await api.post("/products", productData);
      return response.data;
    } catch (error) {
      console.error("Error in createProduct:", error);
      throw error;
    }
  },

  // Admin: Update product
  updateProduct: async (
    id: string,
    productData: Partial<Product>
  ): Promise<Product> => {
    try {
      const response = await api.put(`/products/${id}`, productData);

      return response.data;
    } catch (error) {
      console.error("Error in updateProduct:", error);
      throw error;
    }
  },

  // Admin: Delete product
  deleteProduct: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      throw error;
    }
  },

  // Add product review
  addReview: async (
    productId: string,
    reviewData: {
      rating: number;
      comment: string;
    }
  ): Promise<Review> => {
    try {
      const response = await api.post(
        `/products/${productId}/reviews`,
        reviewData
      );
      return response.data;
    } catch (error) {
      console.error("Error in addReview:", error);
      throw error;
    }
  },
};

export default productService;
