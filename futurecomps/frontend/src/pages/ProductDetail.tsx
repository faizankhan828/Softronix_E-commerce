import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  ShoppingCart,
  MessageCircle,
  Star,
  Home,
  ThumbsUp,
  CheckCircle2,
  ZoomIn,
  Package,
  Check,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/store";

const reviews = [
  {
    id: 1,
    name: "Sarah M.",
    avatar: "https://i.pravatar.cc/100?img=1",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "Absolutely love this product! The quality exceeded my expectations. Would definitely buy again.",
    helpful: 24,
    verified: true,
  },
  {
    id: 2,
    name: "John D.",
    avatar: "https://i.pravatar.cc/100?img=2",
    rating: 4,
    date: "1 month ago",
    comment:
      "Great product, fast shipping. Would recommend to anyone looking for quality.",
    helpful: 18,
    verified: true,
  },
  {
    id: 3,
    name: "Emily R.",
    avatar: "https://i.pravatar.cc/100?img=3",
    rating: 5,
    date: "3 weeks ago",
    comment:
      "Perfect for what I needed. The AI chat helped me find exactly the right item!",
    helpful: 31,
    verified: false,
  },
];

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoom, setImageZoom] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const {
    products,
    addToCart,
    setCartOpen,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useStore();

  const isWishlisted = product ? isInWishlist(product._id) : false;

  useEffect(() => {
    setLoading(true);
    const foundProduct = products.find((p) => p._id === id);
    if (foundProduct) {
      setProduct(foundProduct);
      if (foundProduct.sizes?.length) setSelectedSize(foundProduct.sizes[0]);
      if (foundProduct.colors?.length) setSelectedColor(foundProduct.colors[0]);
    }
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, products]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedSize, selectedColor);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity, selectedSize, selectedColor);
      setCartOpen(true);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const relatedProducts = products
    .filter((p) => p._id !== id && p.category === product?.category)
    .slice(0, 4);

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="space-y-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  /* ---------- NOT FOUND ---------- */
  if (!product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-md mx-auto">
            <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
            <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
              Product Not Found
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              The product you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Button asChild variant="gradient" size="lg">
              <Link to="/shop">Browse All Products</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const images = product.images?.length ? product.images : [product.imageUrl];
  const displayPrice = product.discountedPrice || product.price;
  const hasDiscount =
    product.originalPrice && product.originalPrice > displayPrice;

  return (
    <MainLayout>
      {/* ==================== HERO / PRODUCT SECTION ==================== */}
      <section className="bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
        <div className="container mx-auto px-4 sm:px-6 pt-6 pb-12 lg:pt-8 lg:pb-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm mb-8 overflow-x-auto no-scrollbar">
            <Link
              to="/"
              className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
            >
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            <Link
              to="/shop"
              className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
            >
              Shop
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            <Link
              to={`/shop?category=${product.category.toLowerCase()}`}
              className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 capitalize transition-colors flex-shrink-0"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            <span className="text-gray-800 dark:text-gray-200 font-medium line-clamp-1">
              {product.name}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            {/* ---- LEFT: Image Gallery ---- */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Image */}
              <motion.div
                layout
                className="relative aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800/60 group cursor-zoom-in shadow-lg shadow-gray-200/50 dark:shadow-black/20"
                onClick={() => setImageZoom(true)}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Zoom hint */}
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ZoomIn className="w-3.5 h-3.5" /> Click to zoom
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isNew && (
                    <Badge variant="info">New Arrival</Badge>
                  )}
                  {hasDiscount && (
                    <Badge variant="destructive">
                      -{Math.round(
                        ((product.originalPrice! - displayPrice) /
                          product.originalPrice!) *
                          100
                      )}
                      %
                    </Badge>
                  )}
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1
                        );
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/80 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1
                        );
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/80 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image counter dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(i);
                        }}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === currentImageIndex
                            ? "w-6 bg-white"
                            : "w-1.5 bg-white/50 hover:bg-white/70"
                        )}
                      />
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {images.map((img, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2",
                        index === currentImageIndex
                          ? "border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-600/20"
                          : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* ---- RIGHT: Product Info ---- */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Category + Name */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                      {product.category}
                    </span>
                    {product.stock && product.stock > 0 ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> In Stock
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Rating
                      value={product.rating}
                      showValue
                      reviewCount={product.reviewCount}
                    />
                  </div>
                </div>

                {/* Price */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={cn(
                        "text-3xl sm:text-4xl font-extrabold tracking-tight",
                        hasDiscount
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-900 dark:text-white"
                      )}
                    >
                      {formatCurrency(displayPrice, product.currency)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-lg text-gray-400 dark:text-gray-500 line-through">
                          {formatCurrency(
                            product.originalPrice!,
                            product.currency
                          )}
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                          Save{" "}
                          {formatCurrency(
                            product.originalPrice! - displayPrice,
                            product.currency
                          )}
                        </span>
                      </>
                    )}
                  </div>
                  {hasDiscount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Price includes all applicable discounts
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[15px]">
                  {product.description}
                </p>

                {/* Size Selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      Size
                      <span className="text-xs font-normal text-gray-400">
                        — {selectedSize}
                      </span>
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {product.sizes.map((size) => (
                        <motion.button
                          key={size}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "min-w-[48px] h-12 px-4 rounded-xl font-semibold text-sm transition-all duration-200 border-2",
                            selectedSize === size
                              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-lg"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                          )}
                        >
                          {size}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      Color
                      <span className="text-xs font-normal text-gray-400">
                        — {selectedColor}
                      </span>
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {product.colors.map((color) => (
                        <motion.button
                          key={color}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border-2",
                            selectedColor === color
                              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-lg"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                          )}
                        >
                          {color}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Quantity
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                      <button
                        onClick={() =>
                          setQuantity((prev) => Math.max(1, prev - 1))
                        }
                        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-14 text-center font-bold text-lg text-gray-900 dark:text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((prev) => prev + 1)}
                        className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {product.stock}
                      </span>{" "}
                      available
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAddToCart}
                      className="flex-1 h-14 rounded-xl flex items-center justify-center gap-2 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:brightness-110 transition-all duration-200"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </motion.button>
                    <Button
                      size="lg"
                      variant="gradient"
                      className="flex-1 h-14 text-base font-semibold rounded-xl"
                      onClick={handleBuyNow}
                    >
                      Buy Now
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (product) {
                          if (isWishlisted) {
                            removeFromWishlist(product._id);
                          } else {
                            addToWishlist(product._id);
                          }
                        }
                      }}
                      className={cn(
                        "flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200",
                        isWishlisted
                          ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/35 hover:brightness-110"
                          : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 hover:brightness-110"
                      )}
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4",
                          isWishlisted && "fill-current"
                        )}
                      />
                      {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleShare}
                      className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/35 hover:brightness-110 transition-all duration-200"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="w-4 h-4" /> Link Copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" /> Share
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  {[
                    {
                      icon: Truck,
                      label: "Free Shipping",
                      desc: "On orders over $50",
                      color: "blue",
                    },
                    {
                      icon: Shield,
                      label: "2-Year Warranty",
                      desc: "Full coverage",
                      color: "emerald",
                    },
                    {
                      icon: RotateCcw,
                      label: "30-Day Returns",
                      desc: "Hassle-free",
                      color: "orange",
                    },
                  ].map((benefit) => (
                    <div
                      key={benefit.label}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          benefit.color === "blue" &&
                            "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          benefit.color === "emerald" &&
                            "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                          benefit.color === "orange" &&
                            "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        )}
                      >
                        <benefit.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {benefit.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {benefit.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Chat CTA */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-r from-indigo-600/5 via-blue-600/5 to-purple-600/5 dark:from-indigo-600/10 dark:via-blue-600/10 dark:to-purple-600/10 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl p-5 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4338ca] to-[#2563eb] flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                      Have questions about this product?
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Chat with our AI Clerk for personalized help
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== REVIEWS SECTION ==================== */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Customer Reviews
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                See what our customers are saying
              </p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {avgRating.toFixed(1)}
                </p>
                <Rating value={avgRating} size="sm" />
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {reviews.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reviews
                </p>
              </div>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="group bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20"
              >
                {/* Reviewer Info */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-11 h-11 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {review.name}
                      </h4>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {review.date}
                    </p>
                  </div>
                </div>

                {/* Rating stars */}
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={cn(
                        "w-4 h-4",
                        idx < review.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200 dark:text-gray-700"
                      )}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                  {review.comment}
                </p>

                {/* Helpful */}
                <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/btn">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Helpful ({review.helpful})
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== RELATED PRODUCTS ==================== */}
      {relatedProducts.length > 0 && (
        <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800/50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  You May Also Like
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Products similar to this one
                </p>
              </div>
              <Link
                to="/shop"
                className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p._id} product={p} index={index} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                to="/shop"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400"
              >
                View All Products <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ==================== FULLSCREEN IMAGE ZOOM ==================== */}
      <AnimatePresence>
        {imageZoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImageZoom(false)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              key={`zoom-${currentImageIndex}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              src={images[currentImageIndex]}
              alt={product.name}
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setImageZoom(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <span className="text-xl">&times;</span>
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? images.length - 1 : prev - 1
                    );
                  }}
                  className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === images.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
