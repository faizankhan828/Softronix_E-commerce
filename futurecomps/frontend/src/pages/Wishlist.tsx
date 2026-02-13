import { useStore } from "@/context/StoreContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart, wishlistLoading } = useStore();

  const handleMoveToCart = (item: any) => {
    addToCart(item.product);
    removeFromWishlist(item.productId);
  };

  if (wishlistLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-20 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="w-8 h-8 text-primary fill-current" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Wishlist
          </h1>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mb-6">
              Browse our products and find something you love!
            </p>
            <Link to="/shop">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <Card key={item._id} className="overflow-hidden group">
                <div className="relative aspect-square">
                  <img
                    src={item.product.images?.[0] || "/placeholder.svg"}
                    alt={item.product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-red-500 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">
                    {item.product.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(
                        item.product.discountedPrice || item.product.price
                      )}
                    </span>
                    {item.product.discountedPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(item.product.price)}
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleMoveToCart(item)}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Move to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
