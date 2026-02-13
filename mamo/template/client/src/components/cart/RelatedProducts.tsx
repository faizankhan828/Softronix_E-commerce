import { useState, useEffect } from "react";
import { useCart } from "../../contexts/CartContext";
import { CartItem } from "../../api/services/cartService";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { ShoppingBag } from "lucide-react";

interface RelatedProductsProps {
  cartItem: CartItem;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

export function RelatedProducts({ cartItem }: RelatedProductsProps) {
  const { getRelatedProducts, addToCart } = useCart();
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true);
      try {
        const relatedProducts = await getRelatedProducts(cartItem.productId);
        setProducts(relatedProducts);
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [cartItem.productId, getRelatedProducts]);

  const handleAddToCart = async (productId: string) => {
    setAddingProductId(productId);
    try {
      // Using default size and color for simplicity
      await addToCart(productId, 1, "M", "Default");
    } catch (error) {
      console.error("Error adding product to cart:", error);
    } finally {
      setAddingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">You might also like</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((index) => (
            <RelatedProductSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-3">You might also like</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-md overflow-hidden flex flex-col"
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover object-center transition-transform hover:scale-105"
              />
            </div>
            <div className="p-3 flex flex-col flex-1">
              <h4 className="font-medium text-sm truncate">{product.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                ${product.price.toFixed(2)}
              </p>
              <div className="mt-auto pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleAddToCart(product.id)}
                  disabled={addingProductId === product.id}
                >
                  {addingProductId === product.id ? (
                    "Adding..."
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedProductSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden">
      <Skeleton className="aspect-square" />
      <div className="p-3">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-20 mb-4" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
