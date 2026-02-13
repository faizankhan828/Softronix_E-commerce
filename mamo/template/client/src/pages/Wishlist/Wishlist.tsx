import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../../contexts/WishlistContext";
import { useCart } from "../../contexts/CartContext";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../components/ui/use-toast";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import productService from "../../api/services/productService";

// Helper function to check if a URL is valid
const isValidUrl = (url: string) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Default image placeholder as a data URI
const DEFAULT_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='Arial, sans-serif' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function Wishlist() {
  const { wishlist, loading, error, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();

  // If error occurred while fetching wishlist
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (productId: string) => {
    console.log(`Removing product from wishlist: ${productId}`);
    try {
      await removeFromWishlist(productId);
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive",
      });
    }
  };

  // Handle add to cart
  const handleAddToCart = async (productId: string) => {
    try {
      // Get product details first to get available sizes and colors
      const product = await productService.getProductById(productId);

      // Use first available size and color
      const size =
        product.sizes && product.sizes.length > 0 ? product.sizes[0] : "M";
      const color =
        product.colors && product.colors.length > 0
          ? product.colors[0]
          : "Black";
      const quantity = 1;

      await addToCart(productId, quantity, size, color);

      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  // Check if wishlist and its items are defined, otherwise use an empty array
  const items = wishlist?.items || [];
  console.log("Wishlist items:", items);
  if (items.length > 0) {
    console.log("First item images:", items[0].product.images);
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto p-6 min-h-[70vh] flex flex-col items-center justify-center">
        <Heart className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Your wishlist is empty</h1>
        <p className="text-muted-foreground mb-6">
          Save items you like by clicking the heart icon on product pages
        </p>
        <Button asChild>
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Wishlist</h1>

      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Saved Items ({items.length})
          </h2>
        </div>

        <Separator className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            // Process the image URL to ensure it's valid
            let imageUrl = DEFAULT_IMAGE;

            if (item.product && item.product.images) {
              console.log(
                `Processing images for item ${item._id}:`,
                item.product.images
              );

              if (
                Array.isArray(item.product.images) &&
                item.product.images.length > 0
              ) {
                const firstImage = item.product.images[0];
                if (firstImage && isValidUrl(firstImage)) {
                  imageUrl = firstImage;
                  console.log("Valid image URL found:", imageUrl);
                } else {
                  console.log("Invalid image URL:", firstImage);
                }
              } else {
                console.log("No valid images array found");
              }
            } else {
              console.log("No product or images data for item:", item._id);
            }

            return (
              <div
                key={item._id}
                className="bg-background border rounded-lg overflow-hidden flex flex-col"
              >
                <Link
                  to={`/product/${item.productId}`}
                  className="relative h-64 overflow-hidden"
                >
                  <img
                    src={imageUrl}
                    alt={item.product?.name || "Product"}
                    className="object-cover w-full h-full transition-transform hover:scale-105"
                    onError={(e) => {
                      console.error("Image load error for:", item.productId);
                      e.currentTarget.src = DEFAULT_IMAGE;
                    }}
                  />

                  {item.product && item.product.discountedPrice && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
                      Sale
                    </span>
                  )}
                </Link>

                <div className="p-4 flex-1 flex flex-col">
                  <Link
                    to={`/product/${item.productId}`}
                    className="text-lg font-medium hover:underline line-clamp-1"
                  >
                    {item.product?.name || "Product"}
                  </Link>

                  <div className="mt-1 mb-4">
                    <p className="font-medium">
                      {item.product && item.product.discountedPrice ? (
                        <>
                          <span>
                            ${item.product.discountedPrice.toFixed(2)}
                          </span>
                          <span className="ml-2 text-sm line-through text-muted-foreground">
                            ${item.product.price.toFixed(2)}
                          </span>
                        </>
                      ) : item.product ? (
                        `$${item.product.price.toFixed(2)}`
                      ) : (
                        "$0.00"
                      )}
                    </p>
                  </div>

                  <div className="mt-auto flex space-x-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => handleAddToCart(item.productId)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive"
                      onClick={() => handleRemoveFromWishlist(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
