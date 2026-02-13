import api from "./api";
import { Product } from "../../types/product";

export interface CarouselItem {
  productId: string;
  title: string;
  subTitle: string;
  description: string;
  mainImage: string;
  detailImage: string;
  lightBackground: string;
  darkBackground: string;
  accentColor: string;
  darkAccentColor: string;
  price: string;
  material: string;
  model: string;
  collection: string;
  displayOrder: number;
}

export interface FeaturedCategory {
  name: string;
  image: string;
  description: string;
  link: string;
  displayOrder: number;
}

export interface SustainableFashion {
  title: string;
  description: string;
  features: string[];
  image: string;
}

export interface ShopBenefit {
  title: string;
  description: string;
  icon: string;
}

export interface Newsletter {
  title: string;
  description: string;
}

export interface HomepageSettings {
  carousel: {
    items: CarouselItem[];
    autoplay: boolean;
    autoplaySpeed: number;
  };
  featuredCategories: FeaturedCategory[];
  newArrivalsCount: number;
  sustainableFashion: SustainableFashion;
  shopBenefits: {
    items: ShopBenefit[];
  };
  newsletter: Newsletter;
}

const homepageService = {
  // Get homepage settings
  getHomepageSettings: async (): Promise<HomepageSettings> => {
    try {
      const response = await api.get<HomepageSettings>("/homepage/settings");
      return response.data;
    } catch (error) {
      console.error("Error fetching homepage settings:", error);
      throw error;
    }
  },

  // Get carousel items
  getCarouselItems: async (): Promise<CarouselItem[]> => {
    try {
      const response = await api.get<CarouselItem[]>("/homepage/carousel");
      return response.data;
    } catch (error) {
      console.error("Error fetching carousel items:", error);
      throw error;
    }
  },

  // Admin: Update homepage settings
  updateHomepageSettings: async (settings: Partial<HomepageSettings>): Promise<HomepageSettings> => {
    try {
      const response = await api.put<HomepageSettings>("/homepage/settings", settings);
      return response.data;
    } catch (error) {
      console.error("Error updating homepage settings:", error);
      throw error;
    }
  },

  // Admin: Add product to carousel
  addProductToCarousel: async (carouselItem: Partial<CarouselItem>): Promise<CarouselItem> => {
    try {
      const response = await api.post<CarouselItem>("/homepage/carousel", carouselItem);
      return response.data;
    } catch (error) {
      console.error("Error adding product to carousel:", error);
      throw error;
    }
  },

  // Admin: Remove product from carousel
  removeProductFromCarousel: async (productId: string): Promise<void> => {
    try {
      await api.delete(`/homepage/carousel/${productId}`);
    } catch (error) {
      console.error("Error removing product from carousel:", error);
      throw error;
    }
  },

  // Admin: Update carousel item
  updateCarouselItem: async (productId: string, updates: Partial<CarouselItem>): Promise<CarouselItem> => {
    try {
      const response = await api.put<CarouselItem>(`/homepage/carousel/${productId}`, updates);
      return response.data;
    } catch (error) {
      console.error("Error updating carousel item:", error);
      throw error;
    }
  },

  // Admin: Get products for carousel selection
  getProductsForCarousel: async (): Promise<Product[]> => {
    try {
      const response = await api.get<Product[]>("/homepage/carousel/products");
      return response.data;
    } catch (error) {
      console.error("Error fetching products for carousel:", error);
      throw error;
    }
  },
};

export default homepageService;
