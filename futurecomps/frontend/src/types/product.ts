export interface Product {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  description: string;
  category?: string;
  images: string[];
  inventory?: number;
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  material?: string;
  fit?: string;
  care?: string;
  origin?: string;
  discount?: number;
  rating?: number;
  reviews?: number;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
}
