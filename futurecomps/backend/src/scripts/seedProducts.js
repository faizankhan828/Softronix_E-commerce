
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const products = [
  // Electronics
  {
    name: "Premium Wireless Noise-Cancelling Headphones",
    price: 299.99,
    description: "Experience silence and superior sound with our premium noise-cancelling headphones. Featuring 30-hour battery life and plush ear cushions.",
    category: "Electronics",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 50,
    attributes: { colors: ["Black", "Silver"], sizes: [] },
    isFeatured: true,
    isNew: false
  },

  {
    name: "Minimalist Mechanical Keyboard",
    price: 129.99,
    description: "Tactile and clicky mechanical switches enclosed in a sleek aluminum frame. RGB backlighting fully customizable.",
    category: "Electronics",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b91add1?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 100,
    attributes: { colors: ["White", "Grey"], sizes: [] },
    isNew: true
  },
  {
    name: "Smart Home Security Camera",
    price: 89.99,
    description: "Keep your home safe with 1080p HD video, night vision, and two-way audio. Installs in minutes.",
    category: "Electronics",
    images: [
      "https://images.unsplash.com/photo-1558002038-1091a1661111?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1557324232-b8917d3c3d63?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 75,
    attributes: { colors: ["White"], sizes: [] }
  },
  {
    name: "Portable Bluetooth Speaker",
    price: 59.99,
    description: "Waterproof and durable, this speaker delivers powerful 360-degree sound. 12 hours of playtime on a single charge.",
    category: "Electronics",
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 200,
    attributes: { colors: ["Blue", "Red", "Black"], sizes: [] }
  },

  // Clothing
  {
    name: "Classic Denim Jacket",
    price: 79.99,
    description: "A timeless wardrobe staple. Made from high-quality denim with a comfortable fit that gets better with age.",
    category: "Clothing",
    images: [
      "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 40,
    attributes: { colors: ["Blue Denim"], sizes: ["S", "M", "L", "XL"] },
    isFeatured: true
  },
  {
    name: "Organic Cotton T-Shirt",
    price: 24.99,
    description: "Soft, breathable, and sustainable. 100% organic cotton essential tee for everyday wear.",
    category: "Clothing",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 150,
    attributes: { colors: ["White", "Black", "Grey", "Navy"], sizes: ["XS", "S", "M", "L", "XL"] }
  },
  {
    name: "Premium Wool Coat",
    price: 199.99,
    description: "Elegant wool blend coat to keep you warm and stylish during the colder months. Tailored fit.",
    category: "Clothing",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 25,
    attributes: { colors: ["Camel", "Black"], sizes: ["S", "M", "L"] },
    isNew: true
  },
  {
    name: "Athletic Running Shorts",
    price: 34.99,
    description: "Lightweight, moisture-wicking shorts designed for performance. Includes a built-in liner and key pocket.",
    category: "Clothing",
    images: [
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1561053720-76cd73ff22c3?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 80,
    attributes: { colors: ["Black", "Blue"], sizes: ["S", "M", "L", "XL"] }
  },
  {
    name: "Comfort Knit Sweater",
    price: 59.99,
    description: "Cozy knit sweater perfect for layering. Features a relaxed fit and ribbed cuffs.",
    category: "Clothing",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 60,
    attributes: { colors: ["Cream", "Green"], sizes: ["S", "M", "L"] }
  },

  // Home & Garden
  {
    name: "Modern Ceramic Vase",
    price: 39.99,
    description: "Handcrafted ceramic vase with a matte finish. Adds a touch of modern elegance to any room.",
    category: "Home & Garden",
    images: [
      "https://images.unsplash.com/photo-1581783342308-f792ca11df53?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 30,
    attributes: { colors: ["White", "Terracotta"], sizes: [] },
    isFeatured: true
  },
  {
    name: "Indoor Potted Fiddle Leaf Fig",
    price: 69.99,
    description: "Large, lush fiddle leaf fig plant in a stylish pot. Easy to care for and purifies the air.",
    category: "Home & Garden",
    images: [
      "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 20,
    attributes: { colors: [], sizes: ["Medium", "Large"] }
  },
  {
    name: "Luxury Soy Candle",
    price: 24.99,
    description: "Hand-poured soy candle with essential oils. Long-burning and fills your home with a calming scent.",
    category: "Home & Garden",
    images: [
      "https://images.unsplash.com/photo-1602825386991-861508d95153?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 100,
    attributes: { colors: ["Lavender", "Vanilla", "Sandalwood"], sizes: [] },
    isNew: true
  },
  {
    name: "Ergonomic Office Chair",
    price: 249.99,
    description: "Adjustable ergonomic chair designed for all-day comfort. Mesh back for breathability and lumbar support.",
    category: "Home & Garden",
    images: [
      "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 15,
    attributes: { colors: ["Black", "Grey"], sizes: [] }
  },
  {
    name: "Bamboo Cutlery Set",
    price: 19.99,
    description: "Eco-friendly reusable bamboo cutlery set with a travel pouch. Perfect for on-the-go meals.",
    category: "Home & Garden",
    images: [
      "https://images.unsplash.com/photo-1595981234058-a9302fb361ba?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 200,
    attributes: { colors: ["Natural"], sizes: [] }
  },

  // Sports
  {
    name: "Professional Yoga Mat",
    price: 49.99,
    description: "Non-slip, extra-thick yoga mat for optimal cushioning and stability. Eco-friendly material.",
    category: "Sports",
    images: [
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1592860822166-7243b8117765?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 60,
    attributes: { colors: ["Purple", "Blue", "Black"], sizes: [] },
    isFeatured: true
  },
  {
    name: "Adjustable Dumbbell Set",
    price: 199.99,
    description: "Space-saving adjustable dumbbells. Change weights from 5lbs to 50lbs with a simple dial turn.",
    category: "Sports",
    images: [
      "https://images.unsplash.com/photo-1586401100388-6158196238ba?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 25,
    attributes: { colors: ["Black"], sizes: [] }
  },
  {
    name: "Running Shoes",
    price: 119.99,
    description: "Lightweight running shoes with responsive cushioning. Designed for speed and comfort on any terrain.",
    category: "Sports",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 80,
    attributes: { colors: ["Red", "Blue", "Black"], sizes: ["7", "8", "9", "10", "11"] },
    isNew: true
  },
  {
    name: "Tennis Racket",
    price: 149.99,
    description: "Graphite composite tennis racket for power and control. Pre-strung and ready to play.",
    category: "Sports",
    images: [
      "https://images.unsplash.com/photo-1617083934555-52951271f280?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 30,
    attributes: { colors: ["Yellow/Black"], sizes: [] }
  },
  {
    name: "Hydro Drinking Bottle",
    price: 29.99,
    description: "Insulated stainless steel water bottle. Keeps drinks cold for 24 hours or hot for 12 hours.",
    category: "Sports",
    images: [
      "https://images.unsplash.com/photo-1602143407151-0111419500be?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 120,
    attributes: { colors: ["Blue", "Pink", "Black", "White"], sizes: ["24oz", "32oz"] }
  }
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for seeding products");

        // Clear existing products? Maybe optional or a flag. 
        // For now, let's clear to ensure clean state and avoid duplicates if running multiple times.
        await Product.deleteMany({});
        console.log("Cleared existing products");

        for (const product of products) {
            await Product.create({
                ...product,
                imageUrl: product.images[0] // Set main image
            });
        }

        console.log(`Successfully seeded ${products.length} products`);
        process.exit(0);
    } catch (error) {
        console.error("Error seeding products:", error);
        process.exit(1);
    }
};

seedProducts();
