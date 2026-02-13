"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import productService from "../api/services/productService";
import { Product } from "../types/product";
import { Link } from "react-router-dom";
import homepageService from "../api/services/homepageService";

// Default colors for products that don't have them defined
const defaultColors = [
  { code: "#2C3E50", name: "Navy" },
  { code: "#34495E", name: "Charcoal" },
  { code: "#7F8C8D", name: "Gray" },
];

const ProductCard = ({ product, idx }: { product: Product; idx: number }) => {
  // Format price to display with currency symbol
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Extract colors from product or use defaults
  const productColors =
    product.colors && product.colors.length > 0
      ? product.colors.map((color) => ({ code: color, name: color }))
      : defaultColors;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: idx * 0.1 }}
      className="group relative bg-gradient-to-br from-white/[0.05] to-white/[0.08] dark:from-gray-800/50 dark:to-gray-900/50 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/10 transition-all duration-500"
    >
      {/* Main container with glass effect */}
      <div className="relative aspect-[3/4] p-6 backdrop-blur-sm">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-black/[0.02]" />

        {/* Product image with hover effects */}
        <div className="absolute inset-4 rounded-2xl overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center transform transition-all duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `url(${
                product.images && product.images.length > 0
                  ? product.images[0]
                  : "/placeholder.svg"
              })`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Product badges */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md border border-white/20 text-white"
          >
            {product.category}
          </motion.span>
          {product.isNew && (
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              New Season
            </motion.span>
          )}
        </div>

        {/* Product info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 pt-12">
          <div className="relative z-10 transform translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(product.price)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm line-through text-white/70">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {productColors.map((color: any) => (
                    <div
                      key={color.code}
                      className="w-4 h-4 rounded-full border-2 border-white/30 hover:border-white transition-colors"
                      style={{ backgroundColor: color.code }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-6 transform opacity-0 group-hover:opacity-100 transition-all duration-500">
              <Link
                to={`/product/${product._id || product.id}`}
                className="flex-1"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 px-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                >
                  View Product
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-colors"
              >
                <Heart className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Hover effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  );
};

const NewArrivals = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Default count that can be overridden by settings
  const [newArrivalsCount, setNewArrivalsCount] = useState(6);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Updated: Increase opacity for background text
  const bgTextOpacity = useTransform(scrollYProgress, [0, 0.3], [0.5, 1]);

  // Fetch new arrivals from API
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);

        // First try to get homepage settings to see if there's a custom count
        try {
          const settings = await homepageService.getHomepageSettings();
          if (settings && settings.newArrivalsCount) {
            setNewArrivalsCount(settings.newArrivalsCount);
          }
        } catch (err) {
          console.warn(
            "Could not fetch homepage settings, using default count"
          );
        }

        // Fetch new arrivals with the configured count
        const newArrivals = await productService.getNewArrivals(
          newArrivalsCount
        );
        // Convert API product type to our Product type with proper type handling
        setProducts(
          newArrivals.map((p: any) => ({
            _id: p.id || "", // Use empty string as fallback
            id: p.id || "", // Use empty string as fallback
            name: p.name || "",
            description: p.description || "",
            price: p.price || 0,
            compareAtPrice: p.discountedPrice || undefined,
            images: p.images || [],
            category: p.category || "",
            tags: p.tags || [],
            colors: p.colors || [],
            sizes: p.sizes || [],
            stock: p.inventory || 0, // Map inventory to stock
            sku: p.sku || "",
            featured: p.isFeatured || false,
            isNew: p.isNew || false,
            isBestSeller: p.isBestSeller || false,
            rating: p.rating || 0,
            reviews: p.reviews || 0,
          }))
        );
        setError(null);
      } catch (err) {
        console.error("Error fetching new arrivals:", err);
        setError("Failed to load new arrivals");
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-800"
      style={{ position: "relative" }}
    >
      {/* Background Text with improved typography */}
      <motion.h1
        style={{ opacity: bgTextOpacity }}
        className="absolute text-[12rem] md:text-[15rem] font-black tracking-tighter text-gray-200/50 dark:text-gray-800/30 select-none"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: "mirror" }}
      >
        arrivals
      </motion.h1>

      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Modern Header Typography */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8 sm:mb-12 lg:mb-16 p-4 sm:p-6 lg:p-8 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/70 dark:border-gray-700/50"
        >
          <div className="relative text-center">
            <span className="block text-xs sm:text-sm uppercase tracking-[0.35em] text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 font-medium">
              Latest Collection
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white tracking-tight leading-tight mb-4 sm:mb-6">
              Discover Modern
              <br />
              Elegance
            </h2>
            <p className="max-w-2xl mx-auto text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-light px-4 sm:px-0">
              Experience the fusion of art and technology with our latest
              collections, crafted for the contemporary lifestyle.
            </p>
          </div>
        </motion.div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
              <p className="text-lg">Loading new arrivals...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-20">
            <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <p className="mb-4">
                We're having trouble loading new arrivals. Please try again
                later.
              </p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
              <p className="text-lg mb-4">No new arrivals available.</p>
              <Link
                to="/shop"
                className="inline-block px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Browse Shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {products.map((product, idx) => (
              <ProductCard
                key={product._id || `product-${idx}`}
                product={product}
                idx={idx}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewArrivals;
