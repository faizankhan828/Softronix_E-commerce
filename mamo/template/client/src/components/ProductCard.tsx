import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../lib/utils";
import { Product } from "../api/services/productService";

// Import the settings service directly
import settingsService from "../api/services/settingsService";

interface ProductCardProps {
  product: Product;
  showTaxInfo?: boolean;
}

export default function ProductCard({
  product,
  showTaxInfo = false,
}: ProductCardProps) {
  // Use React state to store settings
  const [taxRate, setTaxRate] = React.useState(7.5); // Default tax rate
  const [currency, setCurrency] = React.useState("USD"); // Default currency

  // Fetch settings on component mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.getStoreSettings();
        setTaxRate(settings.taxRate);
        setCurrency(settings.currency);
      } catch (error) {
        console.warn("Failed to fetch settings, using defaults");
      }
    };

    fetchSettings();
  }, []);

  // Format currency with the store currency or fallback
  const formatPrice = (amount: number) => formatCurrency(amount, currency);

  // Calculate price with tax if needed - currently unused but kept for future use
  /*
  const calculatePriceWithTax = (price: number) => {
    if (!showTaxInfo) return price;
    const taxRateDecimal = taxRate / 100;
    return price * (1 + taxRateDecimal);
  };
  */

  // Calculate the display price (discounted or regular)
  const displayPrice = product.discountedPrice || product.price;

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
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

        <div className="p-4">
          <h3 className="font-medium mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-muted-foreground text-sm mb-2 line-clamp-1 dark:text-gray-400">
            {product.category}
          </p>

          <div className="flex items-center justify-between">
            <div>
              {product.discountedPrice ? (
                <div className="flex items-center">
                  <span className="font-medium">
                    {formatPrice(displayPrice)}
                  </span>
                  <span className="ml-2 text-sm line-through text-muted-foreground dark:text-gray-500">
                    {formatPrice(product.price)}
                  </span>
                </div>
              ) : (
                <span className="font-medium">{formatPrice(displayPrice)}</span>
              )}

              {showTaxInfo && (
                <div className="text-xs text-muted-foreground mt-1">
                  {taxRate > 0 ? <>Inc. {taxRate}% tax</> : <>Tax-free</>}
                </div>
              )}
            </div>

            <div
              className={`w-3 h-3 rounded-full ${
                product.inStock ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
          </div>
        </div>
      </Link>
    </div>
  );
}
