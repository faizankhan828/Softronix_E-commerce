import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3,
  LayoutList,
  ChevronDown,
  X,
  Search,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import type { SortOption } from "@/types/store";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const categories = [
  "All",
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Beauty",
];

export function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSearch, setLocalSearch] = useState("");

  const {
    filteredProducts,
    loading,
    filters,
    setFilters,
    clearFilters,
  } = useStore();

  // Sync URL params with filters
  useEffect(() => {
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") as SortOption;

    if (category) setFilters({ category });
    if (search) {
      setFilters({ search });
      setLocalSearch(search);
    }
    if (sort) setFilters({ sortBy: sort });
  }, [searchParams, setFilters]);

  const handleCategoryClick = (category: string) => {
    if (category === "All") {
      setFilters({ category: undefined });
      searchParams.delete("category");
    } else {
      setFilters({ category });
      searchParams.set("category", category.toLowerCase());
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (value: SortOption) => {
    setFilters({ sortBy: value });
    searchParams.set("sort", value);
    setSearchParams(searchParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setFilters({ search: localSearch.trim() });
      searchParams.set("search", localSearch.trim());
    } else {
      setFilters({ search: undefined });
      searchParams.delete("search");
    }
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    clearFilters();
    setLocalSearch("");
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = filters.category || filters.search || filters.sortBy !== "relevance";

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">Shop All Products</h1>
            <p className="text-muted-foreground">
              Discover our curated collection of premium products
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Filters Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <Input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search products..."
                  icon={<Search className="w-4 h-4" />}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </form>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {categories.map((category) => {
                  const isActive = (!filters.category && category === "All") ||
                    filters.category?.toLowerCase() === category.toLowerCase();
                  return (
                    <motion.button
                      key={category}
                      onClick={() => handleCategoryClick(category)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      )}
                    >
                      {category}
                    </motion.button>
                  );
                })}
              </div>

              {/* Sort & View */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="hidden sm:flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 gap-0.5">
                  <motion.button
                    onClick={() => setViewMode("grid")}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      viewMode === "grid"
                        ? "bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode("list")}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                  >
                    <LayoutList className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
              >
                <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
                {filters.category && (
                  <Badge variant="secondary" className="capitalize">
                    {filters.category}
                    <button
                      onClick={() => handleCategoryClick("All")}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary">
                    "{filters.search}"
                    <button
                      onClick={() => {
                        setFilters({ search: undefined });
                        setLocalSearch("");
                        searchParams.delete("search");
                        setSearchParams(searchParams);
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-2 font-medium"
                >
                  Clear all
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
            </p>
          </div>

          {/* Product Grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "grid gap-6",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                )}
              >
                {[...Array(12)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </motion.div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={handleClearFilters}>Clear Filters</Button>
              </motion.div>
            ) : (
              <motion.div
                key="products"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "grid gap-6",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                )}
              >
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
