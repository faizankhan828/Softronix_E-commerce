import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast";
import productService, { Product } from "../../api/services/productService";
import settingsService from "../../api/services/settingsService";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { useFormatCurrency } from "../../hooks/useFormatCurrency";
import { Button } from "../../components/ui/button";
import { LoadingButton } from "../../components/ui/loading-button";
import { Separator } from "../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Star,
  StarHalf,
  ArrowLeft,
  Check,
} from "lucide-react";

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const formatCurrency = useFormatCurrency();

  // Use state for settings
  const [taxRate, setTaxRate] = useState(7.5); // Default tax rate

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.getStoreSettings();
        setTaxRate(settings.taxRate);
      } catch (error) {
        console.warn("Failed to fetch settings, using defaults");
      }
    };

    fetchSettings();
  }, []);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [wishlistStatus, setWishlistStatus] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Load product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        console.error("Product ID is missing");
        setError("Product ID is required");
        setLoading(false);
        return;
      }

      console.log(`Attempting to fetch product with ID: ${productId}`);
      setLoading(true);

      try {
        console.log(`Making API request to: /products/${productId}`);
        const data = await productService.getProductById(productId);
        console.log("API response received:", data);

        if (!data) {
          console.error("Product data is empty");
          setError("Product not found or data is empty");
          setLoading(false);
          return;
        }

        setProduct(data);
        console.log("Product data set successfully:", data);

        // Set default selections
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        } else {
          console.warn("Product has no sizes available");
        }

        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        } else {
          console.warn("Product has no colors available");
        }

        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch product:", err);
        console.error("Error details:", err.message);
        if (err.response) {
          console.error("Response status:", err.response.status);
          console.error("Response data:", err.response.data);
        }
        setError(
          `Failed to load product details: ${err.message || "Unknown error"}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Check wishlist status
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!productId) return;

      try {
        const status = await isInWishlist(productId);
        setWishlistStatus(status);
      } catch (err) {
        console.error("Failed to check wishlist status:", err);
      }
    };

    checkWishlistStatus();
  }, [productId, isInWishlist]);

  // Handle quantity change
  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    setQuantity(value);
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product || !selectedSize || !selectedColor) {
      toast({
        title: "Please select options",
        description: "Please select size and color before adding to cart",
        variant: "destructive",
      });
      return;
    }

    setAddToCartLoading(true);
    try {
      await addToCart(product.id, quantity, selectedSize, selectedColor);

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
      setAddToCartLoading(false);
    }
  };

  // Handle add to wishlist
  const handleAddToWishlist = async () => {
    if (!product) return;

    setWishlistLoading(true);
    try {
      await addToWishlist(product.id);
      setWishlistStatus(true);

      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add item to wishlist",
        variant: "destructive",
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`star-${i}`}
          className="text-yellow-400 fill-yellow-400 h-4 w-4"
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf
          key="half-star"
          className="text-yellow-400 fill-yellow-400 h-4 w-4"
        />
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 max-w-md w-full">
          <p className="text-center">{error || "Product not found"}</p>

          {/* Debug information */}
          {/* <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">
            <p>Debug Information:</p>
            <p>Product ID from URL: {productId || "Missing"}</p>
            <p>Current pathname: {window.location.pathname}</p>
            <p>Loading state: {loading ? "Loading" : "Not loading"}</p>
            <p>Error: {error || "None"}</p>
          </div> */}
        </div>
        <Button asChild>
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Breadcrumb */}
      <div className="mb-4 sm:mb-6">
        <Button variant="ghost" size="sm" asChild className="pl-0">
          <Link to="/shop" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Back to Shop</span>
            <span className="xs:hidden">Back</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Product Images */}
        <div className="order-1">
          <div className="aspect-square overflow-hidden rounded-lg mb-3 sm:mb-4">
            <img
              src={product.images[activeImage]}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </div>

          {product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`h-16 w-16 sm:h-20 sm:w-20 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                    activeImage === index
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <img
                    src={image}
                    alt={`${product.name} - View ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="order-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {product.name}
          </h1>

          <div className="flex items-center mt-2 mb-4">
            <div className="flex mr-2">
              {renderStarRating(product.rating || 0)}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {product.rating?.toFixed(1)} ({product.reviews?.length || 0}{" "}
              reviews)
            </span>
          </div>

          <div className="mt-4 mb-4 sm:mb-6">
            <p className="text-xl sm:text-2xl font-bold">
              {product.discountedPrice ? (
                <>
                  <span>{formatCurrency(product.discountedPrice)}</span>
                  <span className="ml-2 text-base sm:text-lg line-through text-muted-foreground">
                    {formatCurrency(product.price)}
                  </span>
                </>
              ) : (
                formatCurrency(product.price)
              )}
            </p>
            {/* Display tax information */}
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {taxRate > 0 ? (
                <>
                  Price {"excludes"} {taxRate}% tax
                </>
              ) : (
                <>Tax-free</>
              )}
            </p>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
            {product.description}
          </p>

          <Separator className="my-4 sm:my-6" />

          {/* Size Selection */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium mb-2">Size</label>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`px-3 py-2 sm:px-4 border rounded-md text-xs sm:text-sm ${
                    selectedSize === size
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`px-3 py-2 sm:px-4 border rounded-md text-xs sm:text-sm ${
                    selectedColor === color
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"
                  }`}
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              <span className="mx-3 sm:mx-4 w-8 text-center text-sm sm:text-base">
                {quantity}
              </span>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(quantity + 1)}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {/* Stock Status */}
          <div className="flex items-center mb-6">
            {product.inStock ? (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm">In Stock</span>
              </div>
            ) : (
              <div className="text-red-500 text-sm">Out of Stock</div>
            )}
          </div>

          {/* Add to Cart Button */}
          <div className="flex space-x-4">
            <LoadingButton
              className="flex-1"
              size="lg"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              loading={addToCartLoading}
              loadingText="Adding to Cart..."
              icon={<ShoppingCart className="h-5 w-5" />}
            >
              Add to Cart
            </LoadingButton>

            <LoadingButton
              variant="outline"
              size="lg"
              onClick={handleAddToWishlist}
              disabled={wishlistStatus}
              loading={wishlistLoading}
            >
              {!wishlistLoading && (
                <Heart
                  className={`h-5 w-5 ${wishlistStatus ? "fill-primary" : ""}`}
                />
              )}
            </LoadingButton>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent
            value="description"
            className="p-4 bg-card rounded-lg mt-4"
          >
            <p className="mb-4">{product.description}</p>
            <p className="text-muted-foreground">
              This classic piece is a must-have for your wardrobe. Versatile and
              timeless, it's perfect for any occasion.
            </p>
          </TabsContent>

          <TabsContent value="details" className="p-4 bg-card rounded-lg mt-4">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="font-medium w-32">Material:</span>
                <span>{product.material || "Not specified"}</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium w-32">Fit:</span>
                <span>{product.fit || "Not specified"}</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium w-32">Care:</span>
                <span>{product.care || "Not specified"}</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium w-32">Origin:</span>
                <span>{product.origin || "Not specified"}</span>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="reviews" className="p-4 bg-card rounded-lg mt-4">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Customer Reviews</h3>
              <div className="flex items-center">
                <div className="flex mr-2">
                  {renderStarRating(product.rating || 0)}
                </div>
                <span className="text-sm text-muted-foreground">
                  Based on {product.reviews?.length || 0} reviews
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-6">
                {product.reviews.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="font-medium">{review.userName}</div>
                        <span className="mx-2">•</span>
                        <div className="flex">
                          {renderStarRating(review.rating)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p>{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  This product has no reviews yet.
                </p>
                <Button>Write a Review</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
