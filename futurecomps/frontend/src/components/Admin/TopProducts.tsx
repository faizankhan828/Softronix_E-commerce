import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
// import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Package, TrendingUp, TrendingDown } from "lucide-react";

export interface TopProduct {
  id: string;
  name: string;
  price: number;
  sales: number;
  change: number; // Percentage change
}

interface TopProductsProps {
  products: TopProduct[];
  isLoading?: boolean;
}

export default function TopProducts({
  products,
  isLoading = false,
}: TopProductsProps) {
  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="border-b border-gray-200 dark:border-gray-800">
        <CardTitle className="text-gray-900 dark:text-white">
          Top Products
        </CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          Your best-selling products by revenue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 dark:bg-primary/20 text-primary font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${(product.price * product.sales).toFixed(2)}
                    </p>
                    <div className="flex items-center text-xs">
                      {product.change > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-green-500">
                            +{product.change}%
                          </span>
                        </>
                      ) : product.change < 0 ? (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                          <span className="text-red-500">
                            {product.change}%
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          0%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No Products Data
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-1">
              Once you have sales, your top products will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
