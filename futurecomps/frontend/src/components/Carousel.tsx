"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";

// Carousel item interface
interface CarouselItem {
  productId: string;
  title: string;
  subTitle: string;
  description: string;
  mainImage: string;
  detailImage: string;
  lightBackground: string;
  darkBackground: string;
  accentColor: string;
  darkAccentColor: string;
  price: string;
  material: string;
  model: string;
  collection: string;
  displayOrder: number;
}

// Default collection data
const defaultCollections: CarouselItem[] = [
  {
    productId: "01",
    title: "ETHEREAL",
    subTitle: "VOID",
    description: "Translucent layers with architectural precision",
    mainImage:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=2035",
    detailImage:
      "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?q=80&w=2070",
    lightBackground: "#F5F5F7",
    darkBackground: "#0A0A0B",
    accentColor: "#6E44FF",
    darkAccentColor: "#8F6FFF",
    price: "$329",
    material: "Memory Fabric",
    model: "VOID.01",
    collection: "GENESIS",
    displayOrder: 0,
  },
  {
    productId: "02",
    title: "LIQUID",
    subTitle: "FORM",
    description: "Biomimetic textiles with fluid properties",
    mainImage:
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=2070",
    detailImage:
      "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?q=80&w=1980",
    lightBackground: "#EEEEF2",
    darkBackground: "#0F0D15",
    accentColor: "#00A3FF",
    darkAccentColor: "#33B6FF",
    price: "$289",
    material: "Flux Composite",
    model: "FORM.02",
    collection: "SYMBIOSIS",
    displayOrder: 1,
  },
  {
    productId: "03",
    title: "KINETIC",
    subTitle: "PULSE",
    description: "Motion-reactive surfaces with haptic feedback",
    mainImage:
      "https://images.unsplash.com/photo-1470309864661-68328b2cd0a5?q=80&w=2070",
    detailImage:
      "https://images.unsplash.com/photo-1495121553079-4c61bcce1894?q=80&w=1976",
    lightBackground: "#F0F0F5",
    darkBackground: "#0D0D11",
    accentColor: "#FF3D00",
    darkAccentColor: "#FF6333",
    price: "$359",
    material: "Neural Mesh",
    model: "PULSE.03",
    collection: "SENTIENT",
    displayOrder: 2,
  },
];

// Text scramble effect component
const ScrambleText = ({
  text,
  isActive,
  className,
}: {
  text: string;
  isActive: boolean;
  className?: string;
}) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "!<>-_\\/[]{}—=+*^?#________";

  useEffect(() => {
    if (!isActive) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;
    const originalText = text;

    const interval = setInterval(() => {
      setDisplayText(
        originalText
          .split("")
          .map((_, idx) => {
            if (idx < iteration) {
              return originalText[idx];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join(""),
      );

      if (iteration >= originalText.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [text, isActive]);

  return <span className={className}>{displayText}</span>;
};

export default function BoundaryCarousel() {
  // State
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTextAnimating, setIsTextAnimating] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [collections, setCollections] =
    useState<CarouselItem[]>(defaultCollections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch carousel items from API
  useEffect(() => {
    const fetchCarouselItems = async () => {
      try {
        setLoading(true);
        const response = await api.get("/products/featured?limit=5");

        console.log("Featured products response:", response.data);

        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          const items: CarouselItem[] = response.data.map(
            (product: any, index: number) => ({
              productId: product._id || product.id || String(index + 1),
              title: product.name?.toUpperCase() || "PRODUCT",
              subTitle: product.category?.toUpperCase() || "COLLECTION",
              description: product.description || "Premium quality product",
              mainImage:
                product.imageUrl ||
                product.images?.[0] ||
                defaultCollections[index % 3].mainImage,
              detailImage:
                product.images?.[1] ||
                defaultCollections[index % 3].detailImage,
              lightBackground: defaultCollections[index % 3].lightBackground,
              darkBackground: defaultCollections[index % 3].darkBackground,
              accentColor: defaultCollections[index % 3].accentColor,
              darkAccentColor: defaultCollections[index % 3].darkAccentColor,
              price: `$${product.price || 299}`,
              material: product.material || "Premium Material",
              model: `MODEL.0${index + 1}`,
              collection: product.category || "COLLECTION",
              displayOrder: index,
            }),
          );
          setCollections(items);
          console.log("Loaded featured products for carousel:", items.length);
        } else {
          console.log("No featured products found, using default collections");
        }
        setError(null);
      } catch (err: any) {
        console.error("Error fetching carousel items:", err);
        console.error("Error response:", err.response?.data);
        // Keep default collections on error - don't break the UI
        setError(err.message || "Failed to load featured products");
      } finally {
        setLoading(false);
      }
    };

    fetchCarouselItems();
  }, []);

  // Get current collection
  const currentCollection = collections[activeIndex];

  // Next and previous indices
  const nextIndex = (activeIndex + 1) % collections.length;
  const prevIndex = (activeIndex - 1 + collections.length) % collections.length;

  // Progress bar animation
  const startProgressAnimation = () => {
    if (progressRef.current) {
      setTimeout(() => {
        if (progressRef.current) {
          progressRef.current.style.transition = "transform 6s linear";
          progressRef.current.style.transform = "scaleX(1)";
        }
      }, 50);
    }
  };

  const resetProgressAnimation = () => {
    if (progressRef.current) {
      progressRef.current.style.transition = "none";
      progressRef.current.style.transform = "scaleX(0)";
    }
  };

  // Auto play functionality
  useEffect(() => {
    if (collections.length === 0 || loading) return;

    const startAutoPlay = () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }

      resetProgressAnimation();

      setTimeout(() => {
        startProgressAnimation();

        autoPlayTimerRef.current = setTimeout(() => {
          if (Date.now() - lastInteraction > 5000 && !isAnimating) {
            handleNext();
          }
        }, 6000);
      }, 50);
    };

    startAutoPlay();

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [activeIndex, lastInteraction, isAnimating, collections, loading]);

  // Navigation handlers
  const handleNext = () => {
    if (isAnimating) return;

    setLastInteraction(Date.now());
    setIsAnimating(true);
    setIsTextAnimating(true);
    resetProgressAnimation();

    requestAnimationFrame(() => {
      setTimeout(() => {
        setActiveIndex(nextIndex);

        setTimeout(() => {
          setIsAnimating(false);
          setTimeout(() => {
            setIsTextAnimating(false);
          }, 600);
        }, 800);
      }, 200);
    });
  };

  const handlePrev = () => {
    if (isAnimating) return;

    setLastInteraction(Date.now());
    setIsAnimating(true);
    setIsTextAnimating(true);
    resetProgressAnimation();

    requestAnimationFrame(() => {
      setTimeout(() => {
        setActiveIndex(prevIndex);

        setTimeout(() => {
          setIsAnimating(false);
          setTimeout(() => {
            setIsTextAnimating(false);
          }, 600);
        }, 800);
      }, 200);
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
          <p className="text-lg">Loading carousel...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <p className="mb-4">
            We're having trouble loading the carousel. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (collections.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <p className="text-lg mb-4">No featured products available.</p>
          <Link
            to="/shop"
            className="inline-block px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            Browse Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden relative bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      style={{ position: "relative" }}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-[48]">
        <div
          ref={progressRef}
          className="h-full origin-left transform-gpu scale-x-0 will-change-transform"
          style={{ backgroundColor: currentCollection?.accentColor }}
        />
      </div>

      {/* Background color */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={`bg-${activeIndex}`}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{ backgroundColor: currentCollection?.lightBackground }}
        />
      </AnimatePresence>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 z-10 opacity-10 pointer-events-none mix-blend-overlay">
        <div
          className="w-full h-full bg-repeat"
          style={{ backgroundImage: "url('/noise.svg')" }}
        />
      </div>

      {/* Main container */}
      <div className="relative z-20 w-full h-full flex flex-col">
        {/* Main carousel */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left side - Images */}
          <div className="w-full lg:w-2/3 relative overflow-hidden h-[500px] sm:h-[600px] lg:h-[650px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`images-${activeIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 z-10"
              >
                {/* Image container */}
                <div className="relative w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-1">
                  {/* Main image */}
                  <div className="h-full overflow-hidden relative order-1 sm:order-none">
                    <motion.div
                      initial={{ scale: 1.2, filter: "blur(8px)" }}
                      animate={{
                        scale: 1,
                        filter: "blur(0px)",
                        transition: {
                          duration: 1.2,
                          ease: [0.6, 0.05, 0.01, 0.9],
                        },
                      }}
                      className="absolute inset-0"
                    >
                      <div className="absolute inset-0 bg-gray-800/10 dark:bg-black/40 z-10" />
                      <img
                        src={currentCollection?.mainImage || "/placeholder.svg"}
                        alt={currentCollection?.title || "Product image"}
                        className="w-full h-full object-cover object-center scale-110 transition-transform duration-700"
                      />
                    </motion.div>

                    {/* Floating information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="absolute bottom-8 left-8 z-20 backdrop-blur-sm bg-white/80 dark:bg-black/60 p-4 rounded-lg shadow-md"
                    >
                      <motion.div
                        className="text-4xl font-bold"
                        style={{ color: currentCollection?.accentColor }}
                      >
                        {currentCollection?.price || "$0"}
                      </motion.div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 text-sm text-gray-700 dark:text-gray-300">
                        <div>Model: {currentCollection?.model || "N/A"}</div>
                        <div>
                          Material: {currentCollection?.material || "N/A"}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Detail image - Hidden on mobile */}
                  <div className="hidden sm:block h-full overflow-hidden relative order-2">
                    <motion.div
                      initial={{ scale: 1.2, filter: "blur(8px)" }}
                      animate={{
                        scale: 1,
                        filter: "blur(0px)",
                        transition: {
                          duration: 1.2,
                          ease: [0.6, 0.05, 0.01, 0.9],
                        },
                      }}
                      className="absolute inset-0"
                    >
                      <div className="absolute inset-0 bg-gray-800/10 dark:bg-black/40 z-10" />
                      <img
                        src={
                          currentCollection?.detailImage || "/placeholder.svg"
                        }
                        alt={`${currentCollection?.title || "Product"} detail`}
                        className="w-full h-full object-cover object-center scale-110 transition-transform duration-700"
                      />
                    </motion.div>

                    {/* Collection badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="absolute top-8 right-8 z-20"
                    >
                      <div
                        className="px-4 py-2 text-xs tracking-widest backdrop-blur-sm bg-white/80 dark:bg-black/60 rounded-lg shadow-md"
                        style={{ color: currentCollection?.accentColor }}
                      >
                        {currentCollection?.collection || "Collection"}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Diagonal pattern overlay */}
            <div className="absolute inset-0 z-30 pointer-events-none">
              <div
                className="w-full h-full bg-repeat opacity-5"
                style={{ backgroundImage: "url('/diagonal-lines.svg')" }}
              />
            </div>
          </div>

          {/* Right side - Text content */}
          <div className="w-full lg:w-1/3 flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12 relative z-30 h-[500px] sm:h-[600px] lg:h-[650px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`content-${activeIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-4 sm:space-y-6 lg:space-y-8 absolute inset-0 flex flex-col justify-center px-4 sm:px-8 lg:px-16"
              >
                {/* Model number with animated stroke */}
                <div
                  className="text-4xl sm:text-6xl lg:text-8xl font-black opacity-20 stroke-text"
                  style={{
                    color: "transparent",
                    WebkitTextStroke: `1px ${
                      currentCollection?.accentColor || "#000"
                    }`,
                  }}
                >
                  {currentCollection?.model ||
                    currentCollection?.collection ||
                    "NEW"}
                </div>

                {/* Collection title with scramble effect */}
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-sm tracking-[0.3em] text-gray-600 dark:text-gray-400"
                  >
                    <ScrambleText
                      text={currentCollection?.subTitle || ""}
                      isActive={isTextAnimating}
                    />
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter relative z-10 glitch-container text-gray-900 dark:text-white"
                    data-text={currentCollection?.title || "Product"}
                  >
                    <ScrambleText
                      text={currentCollection?.title || "Product"}
                      isActive={isTextAnimating}
                      className="glitch-text relative inline-block"
                    />

                    {/* Glitch layers */}
                    <div
                      className="absolute -top-1 -left-1 text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter z-0 opacity-30"
                      style={{
                        color: currentCollection?.accentColor || "#000",
                        filter: "blur(1px)",
                      }}
                      aria-hidden="true"
                    >
                      {currentCollection?.title || "Product"}
                    </div>
                  </motion.h1>
                </div>

                {/* Description with text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg max-w-md text-gray-700 dark:text-gray-300 line-clamp-3"
                >
                  {currentCollection?.description ||
                    "No description available."}
                </motion.p>

                {/* CTA buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col space-y-4 mt-auto"
                >
                  <Link to={`/product/${currentCollection?.productId || ""}`}>
                    <motion.button
                      className="relative overflow-hidden group rounded-full shadow-md w-full"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className="px-8 py-3 relative z-10 flex items-center justify-between w-full"
                        style={{
                          backgroundColor:
                            currentCollection?.accentColor || "#000",
                        }}
                      >
                        <span className="text-sm uppercase tracking-wider text-white">
                          View Product
                        </span>
                        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0 rounded-full" />
                    </motion.button>
                  </Link>

                  <motion.button
                    className="relative overflow-hidden group rounded-full border border-gray-300 dark:border-gray-700 shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="px-8 py-3 relative z-10 flex items-center justify-between w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full">
                      <span className="text-sm uppercase tracking-wider text-gray-800 dark:text-gray-200">
                        Add to Wishlist
                      </span>
                      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 text-gray-800 dark:text-gray-200" />
                    </div>
                  </motion.button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom navigation indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 flex space-x-3">
        {collections.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              if (isAnimating || index === activeIndex) return;

              setLastInteraction(Date.now());
              setIsAnimating(true);
              setIsTextAnimating(true);
              resetProgressAnimation();

              requestAnimationFrame(() => {
                setTimeout(() => {
                  setActiveIndex(index);

                  setTimeout(() => {
                    setIsAnimating(false);

                    setTimeout(() => {
                      setIsTextAnimating(false);
                    }, 600);
                  }, 600);
                }, 200);
              });
            }}
            className={cn(
              "group relative w-14 h-1 rounded-full transition-all duration-300",
              index === activeIndex
                ? "bg-gray-800 dark:bg-gray-200"
                : "bg-gray-400/50 hover:bg-gray-600/50 dark:bg-gray-700/50 dark:hover:bg-gray-500/50",
            )}
          >
            {/* Preview on hover */}
            <AnimatePresence>
              {index !== activeIndex && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 h-24 overflow-hidden rounded shadow-md group-hover:opacity-100 opacity-0"
                >
                  <img
                    src={item.mainImage || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-2">
                    <span className="text-xs font-bold text-center text-gray-800 dark:text-gray-200">
                      {item.title}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>

      {/* Side navigation buttons */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 z-40 flex flex-col space-y-6">
        <motion.button
          onClick={handlePrev}
          className={cn(
            "w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm",
            isAnimating && "opacity-50 cursor-not-allowed",
          )}
          disabled={isAnimating}
          whileHover={
            isAnimating
              ? {}
              : { scale: 1.1, borderColor: "rgba(107, 114, 128, 0.4)" }
          }
          whileTap={isAnimating ? {} : { scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        </motion.button>

        <motion.button
          onClick={handleNext}
          className={cn(
            "w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:border-gray-400 dark:hover:border-gray-500 transition-colors shadow-sm",
            isAnimating && "opacity-50 cursor-not-allowed",
          )}
          disabled={isAnimating}
          whileHover={
            isAnimating
              ? {}
              : { scale: 1.1, borderColor: "rgba(107, 114, 128, 0.4)" }
          }
          whileTap={isAnimating ? {} : { scale: 0.9 }}
        >
          <ChevronRight className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        </motion.button>
      </div>
    </div>
  );
}
