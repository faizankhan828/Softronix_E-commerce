import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/context/StoreContext";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types/store";

const ProductCard = ({ product, idx }: { product: Product; idx: number }) => {
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.price - (product.discountedPrice || 0)) / product.price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: idx * 0.1 }}
      className="group relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500"
    >
      {/* Main container */}
      <div className="relative aspect-[3/4] p-4">
        {/* Product image */}
        <div className="absolute inset-3 rounded-xl overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center transform transition-all duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `url(${product.imageUrl || product.images?.[0] || "/placeholder.svg"})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Product badges */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
          {product.isNew && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
              New
            </span>
          )}
          {hasDiscount && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Product info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 pt-8">
          <div className="relative z-10 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {product.category}
              </p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm line-through text-gray-500">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({product.rating})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500">
              <Link
                to={`/product/${product._id}`}
                className="flex-1"
              >
                <button className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 text-sm">
                  View Product
                </button>
              </Link>
              <button className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Hover effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
      </div>
    </motion.div>
  );
};

export function NewArrivals() {
  const { featuredProducts, loading } = useStore();

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Featured Products
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Handpicked items just for you
          </p>
        </div>
        <Link
          to="/shop"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          View All
          <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
          : featuredProducts.slice(0, 8).map((product, index) => (
              <ProductCard key={product._id} product={product} idx={index} />
            ))}
      </div>
    </section>
  );
}
