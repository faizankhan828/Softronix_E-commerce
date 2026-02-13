import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Bookmark, Tag, ShoppingBag, Shirt } from "lucide-react";
import { Link } from "react-router-dom";
import productService from "../api/services/productService";

// Define category type
interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  count: number;
  tags: string[];
  icon: JSX.Element;
  accent?: string; // Optional accent color
}

// Category icon mapping
const categoryIcons: Record<string, JSX.Element> = {
  tops: <Shirt className="w-5 h-5" />,
  bottoms: <Tag className="w-5 h-5" />,
  dresses: <Shirt className="w-5 h-5" />,
  outerwear: <Shirt className="w-5 h-5" />,
  accessories: <ShoppingBag className="w-5 h-5" />,
  default: <Tag className="w-5 h-5" />,
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });

  // State for category statistics
  const [categoryStats, setCategoryStats] = useState<
    Record<
      string,
      {
        newArrivals: number;
        bestSellers: number;
        rating: string;
      }
    >
  >({});

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        // Get all products
        const response = await productService.getProducts({ limit: 100 });

        // Extract unique categories and count products in each category
        const categoryCounts: Record<string, number> = {};
        const newArrivalsCount: Record<string, number> = {};
        const bestSellersCount: Record<string, number> = {};
        const ratingSum: Record<string, number> = {};
        const ratingCount: Record<string, number> = {};

        response.products.forEach((product) => {
          if (product.category) {
            // Count total products per category
            categoryCounts[product.category] =
              (categoryCounts[product.category] || 0) + 1;

            // Count new arrivals
            if (product.isNew) {
              newArrivalsCount[product.category] =
                (newArrivalsCount[product.category] || 0) + 1;
            }

            // Count featured/best sellers
            if (product.isFeatured) {
              bestSellersCount[product.category] =
                (bestSellersCount[product.category] || 0) + 1;
            }

            // Calculate average rating
            if (product.rating) {
              ratingSum[product.category] =
                (ratingSum[product.category] || 0) + product.rating;
              ratingCount[product.category] =
                (ratingCount[product.category] || 0) + 1;
            }
          }
        });

        // Calculate stats for each category
        const stats: Record<
          string,
          { newArrivals: number; bestSellers: number; rating: string }
        > = {};
        Object.keys(categoryCounts).forEach((category) => {
          const avgRating = ratingCount[category]
            ? (ratingSum[category] / ratingCount[category]).toFixed(1)
            : "0.0";

          stats[category] = {
            newArrivals: newArrivalsCount[category] || 0,
            bestSellers: bestSellersCount[category] || 0,
            rating: `${avgRating}/5`,
          };
        });

        setCategoryStats(stats);

        // Create category objects
        const categoryData: Category[] = Object.entries(categoryCounts)
          .map(([id, count]) => {
            // Format category name for display (capitalize first letter)
            const name =
              id.charAt(0).toUpperCase() + id.slice(1) + " Collection";

            // Get a relevant image from products in this category
            const categoryProduct = response.products.find(
              (p) => p.category === id
            );
            const image =
              categoryProduct?.images?.[0] ||
              "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000";

            // Generate a consistent accent color based on category name
            const getAccentColor = (categoryId: string) => {
              // Simple hash function to generate a consistent color
              const hash = categoryId.split("").reduce((acc, char) => {
                return char.charCodeAt(0) + ((acc << 5) - acc);
              }, 0);

              // Use grayscale colors for black and white theme
              return `#${Math.abs(hash)
                .toString(16)
                .substring(0, 6)
                .padEnd(6, "0")}`;
            };

            return {
              id,
              name,
              description: `Explore our ${id} collection featuring the latest styles and trends.`,
              image,
              count,
              tags: ["New Season", "Trending"],
              icon: categoryIcons[id] || categoryIcons.default,
              accent: getAccentColor(id),
            };
          })
          .sort((a, b) => b.count - a.count); // Sort by product count

        setCategories(categoryData);

        // Set initial active category
        if (categoryData.length > 0) {
          setActiveCategory(categoryData[0].id);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");

        // Set fallback categories if API fails
        setCategories([
          {
            id: "tops",
            name: "Tops Collection",
            description:
              "Explore our tops collection featuring the latest styles and trends.",
            image:
              "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000",
            count: 0,
            tags: ["New Season"],
            icon: categoryIcons.tops,
            accent: "#333333",
          },
          {
            id: "bottoms",
            name: "Bottoms Collection",
            description:
              "Discover our bottoms collection with styles for every occasion.",
            image:
              "https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=1000",
            count: 0,
            tags: ["Trending"],
            icon: categoryIcons.bottoms,
            accent: "#666666",
          },
        ]);

        // Set initial active category for fallback
        setActiveCategory("tops");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Get active category
  const activeCategoryData =
    categories.find((c) => c.id === activeCategory) || categories[0];

  // Show loading state
  if (loading) {
    return (
      <section className="py-24 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error && categories.length === 0) {
    return (
      <section className="py-24 flex justify-center items-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Failed to load categories
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="py-24 relative overflow-hidden bg-white dark:bg-gray-900"
      ref={containerRef}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white dark:from-gray-900 to-transparent opacity-60"></div>
      <div
        className="absolute right-0 top-1/3 w-64 h-64 rounded-full"
        style={{
          background: "rgba(0, 0, 0, 0.03)",
          filter: "blur(80px)",
        }}
      ></div>
      <div
        className="absolute left-0 bottom-0 w-96 h-96 rounded-full"
        style={{
          background: "rgba(0, 0, 0, 0.02)",
          filter: "blur(100px)",
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 mb-8 sm:mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center mb-3 py-1 px-3 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              <Bookmark className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
              Collections
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Browse Categories
            </h2>
          </motion.div>

          <motion.p
            className="text-neutral-500 dark:text-neutral-400 max-w-md text-sm sm:text-base"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Explore our carefully curated collections designed to elevate your
            style and express your unique identity.
          </motion.p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Category navigation sidebar */}
          <div
            className="lg:col-span-3 flex flex-row lg:flex-col gap-2 sm:gap-3 overflow-auto pb-4 lg:pb-0 mb-4 sm:mb-6 lg:mb-0 min-h-[150px] sm:min-h-[200px]"
            style={{ scrollbarWidth: "none" }}
          >
            {loading ? (
              // Loading skeleton for categories
              Array(4)
                .fill(0)
                .map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-xl p-4 flex items-center gap-4 bg-gray-100 dark:bg-gray-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
            ) : categories.length === 0 ? (
              // No categories found
              <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                No categories found
              </div>
            ) : (
              // Actual categories
              categories.map((category) => (
                <button
                  key={category.id}
                  className={`relative text-left rounded-xl p-4 flex items-center gap-4 ${
                    activeCategory === category.id
                      ? "bg-white dark:bg-gray-700 shadow-lg shadow-black/[0.03] dark:shadow-black/[0.1]"
                      : "bg-neutral-50 dark:bg-gray-800/70 hover:bg-white/80 dark:hover:bg-gray-700/50"
                  } transition-colors`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {category.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                      {category.count} Products
                    </p>
                  </div>

                  {activeCategory === category.id && (
                    <div className="absolute inset-y-0 right-0 w-1 rounded-full my-2 bg-black dark:bg-white" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Featured category content */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative overflow-hidden"
              >
                {!activeCategoryData ? (
                  // Loading or no data state
                  <div className="rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] relative bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      {loading
                        ? "Loading category data..."
                        : "No category selected"}
                    </div>
                  </div>
                ) : (
                  // Category content
                  <div className="rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] relative">
                    {/* Background image with overlay */}
                    <div className="absolute inset-0 overflow-hidden">
                      <img
                        src={activeCategoryData.image}
                        alt={activeCategoryData.name}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        onError={(e) => {
                          // Fallback image if the main one fails to load
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/5"></div>
                    </div>

                    {/* Content */}
                    <div className="relative h-full p-8 md:p-12 flex flex-col justify-between">
                      <div className="flex gap-2">
                        {activeCategoryData.tags &&
                          activeCategoryData.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`inline-block rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md cursor-pointer ${
                                hoveredTag === tag
                                  ? "bg-white/80 text-black"
                                  : "bg-white/15 text-white/90"
                              }`}
                              onMouseEnter={() => setHoveredTag(tag)}
                              onMouseLeave={() => setHoveredTag(null)}
                            >
                              {tag}
                            </span>
                          ))}
                      </div>

                      <div className="max-w-md">
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                          {activeCategoryData.name}
                        </h3>
                        <p className="text-white/80 mb-6">
                          {activeCategoryData.description}
                        </p>

                        <div className="flex flex-wrap gap-6">
                          <Link to={`/shop?category=${activeCategoryData.id}`}>
                            <button className="group inline-flex items-center gap-2 px-6 py-3 rounded-full text-black font-medium bg-white hover:bg-opacity-95 transition-colors">
                              Shop Now
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                          </Link>

                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-4">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="w-10 h-10 rounded-full border-2 border-white overflow-hidden"
                                >
                                  <img
                                    src={`https://randomuser.me/api/portraits/women/${
                                      i + 20
                                    }.jpg`}
                                    alt="Customer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="text-white">
                              <span className="text-sm opacity-80">
                                Trusted by
                              </span>
                              <span className="ml-1 font-medium">
                                {activeCategoryData.count * 10}+
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats bar */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Products",
                      value: activeCategoryData.count || 0,
                    },
                    {
                      label: "New Arrivals",
                      value:
                        categoryStats[activeCategoryData.id]?.newArrivals || 0,
                    },
                    {
                      label: "Best Sellers",
                      value:
                        categoryStats[activeCategoryData.id]?.bestSellers || 0,
                    },
                    {
                      label: "Customer Rating",
                      value:
                        categoryStats[activeCategoryData.id]?.rating || "0.0/5",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 bg-white dark:bg-gray-700 rounded-xl shadow-sm"
                    >
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                        {stat.label}
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
