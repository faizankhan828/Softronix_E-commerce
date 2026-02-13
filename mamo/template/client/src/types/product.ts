export interface Product {
  _id: string;
  id?: string; // Some components use id instead of _id
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  discountedPrice?: number; // Added for NewArrivals component
  images: string[];
  category: string;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
  stock: number;
  sku?: string;
  featured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  rating?: number;
  reviews?: number;
  createdAt?: string;
  updatedAt?: string;
  taxIncluded?: boolean;
  taxRate?: number;
  material?: string;
  fit?: string;
  care?: string;
  origin?: string;
}

export interface Collection {
  _id?: string;
  title: string;
  subTitle?: string;
  description?: string;
  mainImage: string;
  detailImage?: string;
  accentColor: string;
  backgroundColor: string;
  model?: string;
  material?: string;
  collection?: string;
  price?: string;
  productId: string;
  active?: boolean;
  order?: number;
}
