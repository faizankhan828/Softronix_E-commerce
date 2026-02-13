import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/store";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useStore();

  const displayPrice = product.discountedPrice || product.price;
  const hasDiscount = product.originalPrice && product.originalPrice > displayPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden card-hover border-0 shadow-md hover:shadow-xl">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Link to={`/product/${product._id}`}>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </Link>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <Badge variant="info" className="shadow-lg">
                New
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="shadow-lg">
                -{Math.round(((product.originalPrice! - displayPrice) / product.originalPrice!) * 100)}%
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
              <Heart className="w-4 h-4" />
            </button>
            <Link
              to={`/product/${product._id}`}
              className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>

          {/* Add to Cart Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button
              className="w-full shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                addToCart(product, 1);
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {product.category}
          </p>
          <Link to={`/product/${product._id}`}>
            <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          
          <Rating
            value={product.rating}
            size="sm"
            reviewCount={product.reviewCount}
            className="mt-2"
          />

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-bold text-lg",
                hasDiscount ? "text-primary" : ""
              )}>
                {formatCurrency(displayPrice, product.currency)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.originalPrice!, product.currency)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
