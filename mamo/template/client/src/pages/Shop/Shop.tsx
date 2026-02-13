import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast";
import productService, { Product } from "../../api/services/productService";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { Button } from "../../components/ui/button";
import { LoadingButton } from "../../components/ui/loading-button";
import { Separator } from "../../components/ui/separator";
import { formatCurrency } from "../../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { ShoppingCart, Heart, Filter, Loader2 } from "lucide-react";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort") || "default"
  );
  const [priceRange, setPriceRange] = useState<string>(
    searchParams.get("price") || ""
  );
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [showTaxInfo] = useState(true);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  // Extract search params
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const price = searchParams.get("price");

  // Sync URL params with local state
  useEffect(() => {
    setSortBy(searchParams.get("sort") || "default");
    setPriceRange(searchParams.get("price") || "");
    setPage(parseInt(searchParams.get("page") || "1", 10));
  }, [searchParams]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const categoriesData = await productService.getCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error("Failed to load categories:", err);
        // Don't show error to user, just use empty categories
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Get price range values
  const getPriceRange = () => {
    if (!price) return null;

    switch (price) {
      case "under-50":
        return { min: 0, max: 50 };
      case "50-100":
        return { min: 50, max: 100 };
      case "100-200":
        return { min: 100, max: 200 };
      case "over-200":
        return { min: 200, max: Infinity };
      default:
        return null;
    }
  };

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Determine the actual sort value to send to the API
        const apiSortValue = sortBy === "default" ? undefined : sortBy;

        // Fetch products with basic filters
        const result = await productService.getProducts({
          category: category || undefined,
          search: search || undefined,
          sort: apiSortValue,
          page,
          limit: 100, // Fetch more products to allow for client-side filtering
        });

        let filteredProducts = [...result.products];

        // If category filter returns no products and we have a category selected,
        // try fetching all products instead
        if (filteredProducts.length === 0 && category && !search) {
          console.log(
            `No products found for category "${category}", falling back to all products`
          );
          const fallbackResult = await productService.getProducts({
            sort: apiSortValue,
            page,
            limit: 100,
          });
          filteredProducts = [...fallbackResult.products];

          // Show toast notification about the fallback
          toast({
            title: "Category not found",
            description: `No products found in "${category}" category. Showing all products instead.`,
            variant: "default",
          });

          // Clear the category from URL params to reflect the fallback
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("category");
          if (price) newParams.set("price", price);
          if (sortBy !== "default") newParams.set("sort", sortBy);
          setSearchParams(newParams, { replace: true });
        }

        // Apply price filter on the client side
        const priceRange = getPriceRange();
        if (priceRange) {
          filteredProducts = filteredProducts.filter((product) => {
            // Use discounted price if available, otherwise use regular price
            const productPrice = product.discountedPrice || product.price;
            return (
              productPrice >= priceRange.min && productPrice <= priceRange.max
            );
          });
        }

        // Apply client-side sorting if needed
        if (sortBy === "rating") {
          filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        // Calculate pagination
        const startIndex = (page - 1) * 12;
        const paginatedProducts = filteredProducts.slice(
          startIndex,
          startIndex + 12
        );

        setProducts(paginatedProducts);
        setTotalProducts(filteredProducts.length);
        setError(null);
      } catch (err) {
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, search, sortBy, page, price, searchParams, setSearchParams]);

  // Handle add to cart
  const handleAddToCart = async (product: Product) => {
    const loadingKey = `cart-${product.id}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      // Default to the first available size and color for simplicity
      const size =
        product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M";
      const color =
        product.colors && product.colors.length > 0
          ? product.colors[0]
          : "Black";
      const quantity = 1;

      await addToCart(product.id, quantity, size, color);

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle add to wishlist
  const handleAddToWishlist = async (product: Product) => {
    const loadingKey = `wishlist-${product.id}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        toast({
          title: "Removed from wishlist",
          description: `${product.name} has been removed from your wishlist`,
        });
      } else {
        await addToWishlist(product.id);
        toast({
          title: "Added to wishlist",
          description: `${product.name} has been added to your wishlist`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Generate page title based on filters
  const getPageTitle = () => {
    if (search) {
      return `Search Results for "${search}"`;
    } else if (category) {
      // Map the category value to a display name
      const categoryMap: Record<string, string> = {
        tops: "Tops",
        bottoms: "Bottoms",
        dresses: "Dresses",
        outerwear: "Outerwear",
        accessories: "Accessories",
      };
      return (
        categoryMap[category] ||
        category.charAt(0).toUpperCase() + category.slice(1)
      );
    } else {
      return "All Products";
    }
  };

  if (loading && page === 1) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex items-center justify-center dark:bg-gray-900 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-400">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 dark:bg-gray-900 dark:text-gray-100">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
        {getPageTitle()}
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Filters - Mobile Toggle */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-between dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
            onClick={() => setFilterExpanded(!filterExpanded)}
          >
            <span className="flex items-center gap-2">
              Filters
              {(category || price || (sortBy && sortBy !== "default")) && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {
                    [
                      category,
                      price,
                      sortBy !== "default" ? sortBy : null,
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </span>
            <Filter size={18} />
          </Button>
        </div>

        {/* Filters - Sidebar */}
        <div
          className={`lg:w-64 ${filterExpanded ? "block" : "hidden"} lg:block`}
        >
          <div className="bg-card rounded-lg shadow p-3 sm:p-4 sticky top-20 sm:top-24 dark:bg-gray-800 dark:border dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Filters</h2>
              {(category || price || (sortBy && sortBy !== "default")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchParams(new URLSearchParams());
                    setFilterExpanded(false);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2 dark:text-gray-300">
                  Categories
                </h3>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Loading categories...
                    </span>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => {
                          setSearchParams(new URLSearchParams());
                          setFilterExpanded(false);
                        }}
                        className={`block py-1 text-sm hover:text-primary w-full text-left ${
                          !category ? "font-medium text-primary" : ""
                        } dark:hover:text-primary-400`}
                      >
                        All Products
                      </button>
                    </li>
                    {categories.map((cat) => {
                      // Format category name for display (capitalize first letter)
                      const displayName =
                        cat.charAt(0).toUpperCase() + cat.slice(1);

                      return (
                        <li key={cat}>
                          <button
                            onClick={() => {
                              const newParams = new URLSearchParams();
                              newParams.set("category", cat);
                              setSearchParams(newParams);
                              setFilterExpanded(false);
                            }}
                            className={`block py-1 text-sm hover:text-primary w-full text-left ${
                              category === cat ? "font-medium text-primary" : ""
                            } dark:hover:text-primary-400`}
                          >
                            {displayName}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Separator className="dark:bg-gray-700" />

              <div>
                <h3 className="text-sm font-medium mb-2 dark:text-gray-300">
                  Price Range
                </h3>
                <ul className="space-y-1">
                  {[
                    { label: "Under $50", value: "under-50" },
                    { label: "$50 - $100", value: "50-100" },
                    { label: "$100 - $200", value: "100-200" },
                    { label: "Over $200", value: "over-200" },
                  ].map((priceOption) => (
                    <li key={priceOption.value}>
                      <button
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          if (priceRange === priceOption.value) {
                            // If already selected, clear the filter
                            newParams.delete("price");
                            newParams.delete("page"); // Reset page
                          } else {
                            // Otherwise set the new filter
                            newParams.set("price", priceOption.value);
                            newParams.delete("page"); // Reset page
                          }
                          setSearchParams(newParams);
                          setFilterExpanded(false); // Close mobile filter
                        }}
                        className={`block py-1 text-sm hover:text-primary w-full text-left dark:hover:text-primary-400 ${
                          priceRange === priceOption.value
                            ? "font-medium text-primary"
                            : ""
                        }`}
                      >
                        {priceOption.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator className="dark:bg-gray-700" />

              <div>
                <h3 className="text-sm font-medium mb-2 dark:text-gray-300">
                  Sort By
                </h3>
                <div className="relative">
                  <Select
                    value={sortBy}
                    onValueChange={(value) => {
                      const newParams = new URLSearchParams(searchParams);
                      if (value && value !== "default") {
                        newParams.set("sort", value);
                      } else {
                        newParams.delete("sort");
                      }
                      newParams.delete("page"); // Reset page
                      setSearchParams(newParams);
                      setFilterExpanded(false); // Close mobile filter
                    }}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="price_asc">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="price_desc">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Sort & Results Count */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
              Showing {products.length} of {totalProducts} items
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm whitespace-nowrap">
                Sort by:
              </span>
              <div className="relative flex-1 sm:flex-none">
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    const newParams = new URLSearchParams(searchParams);
                    if (value && value !== "default") {
                      newParams.set("sort", value);
                    } else {
                      newParams.delete("sort");
                    }
                    newParams.delete("page"); // Reset page
                    setSearchParams(newParams);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price_asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price_desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {products.map((product) => (
                <div key={product.id} className="product-card-container">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
                    <Link to={`/product/${product.id}`} className="block">
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                        />
                        {product.discountedPrice && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
                            Sale
                          </span>
                        )}
                        {product.isNew && (
                          <span className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs font-medium rounded">
                            New
                          </span>
                        )}
                      </div>

                      <div className="p-3 sm:p-4 dark:text-gray-100">
                        <h3 className="font-medium mb-1 line-clamp-1 text-sm sm:text-base">
                          {product.name}
                        </h3>
                        <p className="text-muted-foreground text-xs sm:text-sm mb-2 line-clamp-1 dark:text-gray-400">
                          {product.category}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {product.discountedPrice ? (
                              <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                                <span className="font-medium dark:text-white text-sm sm:text-base">
                                  {formatCurrency(
                                    product.discountedPrice,
                                    "USD"
                                  )}
                                </span>
                                <span className="text-xs sm:text-sm line-through text-muted-foreground dark:text-gray-500">
                                  {formatCurrency(product.price, "USD")}
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium dark:text-white text-sm sm:text-base">
                                {formatCurrency(product.price, "USD")}
                              </span>
                            )}

                            {showTaxInfo && (
                              <div className="text-xs text-muted-foreground mt-1 dark:text-gray-400">
                                Tax included
                              </div>
                            )}
                          </div>

                          <div
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ml-2 ${
                              product.inStock ? "bg-green-500" : "bg-red-500"
                            }`}
                            title={
                              product.inStock ? "In Stock" : "Out of Stock"
                            }
                          ></div>
                        </div>
                      </div>
                    </Link>

                    <div className="p-3 sm:p-4 pt-0 flex space-x-2 border-t dark:border-gray-700">
                      <LoadingButton
                        className="flex-1 bg-primary hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/80 text-xs sm:text-sm"
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        loading={loadingStates[`cart-${product.id}`]}
                        loadingText="Adding..."
                        icon={<ShoppingCart className="h-4 w-4" />}
                      >
                        Add to Cart
                      </LoadingButton>
                      <LoadingButton
                        variant="outline"
                        size="icon"
                        className={
                          isInWishlist(product.id)
                            ? "text-red-500 border-red-200 dark:border-red-800 dark:bg-red-900/20"
                            : "border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                        }
                        onClick={() => handleAddToWishlist(product)}
                        loading={loadingStates[`wishlist-${product.id}`]}
                      >
                        {!loadingStates[`wishlist-${product.id}`] && (
                          <Heart
                            className={`h-4 w-4 ${
                              isInWishlist(product.id) ? "fill-red-500" : ""
                            }`}
                          />
                        )}
                      </LoadingButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted py-12 px-4 rounded-lg text-center">
              <p className="text-lg mb-4">No products found</p>
              <p className="text-muted-foreground mb-6">
                {category || price || (sortBy && sortBy !== "default")
                  ? "Try adjusting your search or filter criteria"
                  : "No products are currently available"}
              </p>
              {category || price || (sortBy && sortBy !== "default") ? (
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchParams(new URLSearchParams());
                    }}
                  >
                    Clear Filters
                  </Button>
                  <Button asChild>
                    <Link to="/shop">View All Products</Link>
                  </Button>
                </div>
              ) : (
                <Button asChild>
                  <Link to="/shop">Refresh</Link>
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalProducts > 12 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    const newParams = new URLSearchParams(searchParams);
                    if (newPage > 1) {
                      newParams.set("page", newPage.toString());
                    } else {
                      newParams.delete("page");
                    }
                    setSearchParams(newParams);
                  }}
                >
                  Previous
                </Button>

                {[...Array(Math.ceil(totalProducts / 12))].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newPage = i + 1;
                      const newParams = new URLSearchParams(searchParams);
                      if (newPage > 1) {
                        newParams.set("page", newPage.toString());
                      } else {
                        newParams.delete("page");
                      }
                      setSearchParams(newParams);
                    }}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === Math.ceil(totalProducts / 12)}
                  onClick={() => {
                    const newPage = Math.min(
                      Math.ceil(totalProducts / 12),
                      page + 1
                    );
                    const newParams = new URLSearchParams(searchParams);
                    if (newPage > 1) {
                      newParams.set("page", newPage.toString());
                    } else {
                      newParams.delete("page");
                    }
                    setSearchParams(newParams);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Debug Information - Only visible in development */}
          {/* {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
              <h3 className="font-bold mb-2">Debug Information</h3>
              <p>Total Products: {totalProducts}</p>
              <p>Current Page: {page}</p>
              <p>Products loaded: {products.length}</p>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Product IDs (for testing):</h4>
                <ul className="grid grid-cols-2 gap-2">
                  {products.map((product) => (
                    <li key={product.id} className="flex items-center">
                      <span className="mr-2">{product.id}</span>
                      <Link
                        to={`/product/${product.id}`}
                        className="text-blue-500 hover:underline"
                        target="_blank"
                      >
                        Test Link
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
