import { useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { Heart, Share2, Plus, Minus } from "lucide-react";
import { cn } from "../lib/utils";

interface Product {
  id: number;
  images: string[];
  title: string;
  description: string;
  price: string;
  sizes: string[];
  colors: string[];
  category: string;
  details: string[];
  inStock: boolean;
}

const products: Product[] = [
  {
    id: 1,
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1800&auto=format",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1800&auto=format",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1800&auto=format",
    ],
    title: "Ethereal Collection",
    description: "Avant-garde designs meets sustainable luxury",
    price: "$299.99",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["#DCD9D4", "#000000", "#A67F5D", "#6B8E4E"],
    category: "Limited Edition",
    details: [
      "Handcrafted in Italy",
      "Sustainable materials",
      "Limited production run",
      "Innovative fabric technology",
    ],
    inStock: true,
  },
  {
    id: 2,
    images: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1800&auto=format",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1800&auto=format",
      "https://images.unsplash.com/photo-1475180098004-ca77a66827be?q=80&w=1800&auto=format",
    ],
    title: "Neo Paradigm",
    description: "Where tradition meets the future",
    price: "$459.99",
    sizes: ["S", "M", "L"],
    colors: ["#2C3137", "#E6D3C3", "#435B66"],
    category: "Avant-garde",
    details: [
      "3D-printed elements",
      "Temperature-adaptive fabric",
      "Modular design",
      "Smart fabric integration",
    ],
    inStock: true,
  },
];

export function ProductDisplay() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX.set(x);
      mouseY.set(y);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: products[currentIndex].title,
          text: products[currentIndex].description,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  const currentProduct = products[currentIndex];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* 3D Image Section */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className="relative h-[80vh] perspective-2000"
            style={{ position: "relative" }}
          >
            <motion.div
              className="w-full h-full relative preserve-3d"
              style={{
                rotateX: rotateXSpring,
                rotateY: rotateYSpring,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    },
                  }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="absolute inset-0 w-full h-full"
                >
                  <div className="relative w-full h-full overflow-hidden rounded-2xl">
                    <img
                      src={currentProduct.images[activeImageIndex]}
                      alt={currentProduct.title}
                      className="w-full h-full object-cover transition-transform duration-1000"
                      style={{
                        transform: isHovered ? "scale(1.1)" : "scale(1)",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Image Thumbnails */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-4 glassmorphism p-4 rounded-2xl"
              >
                {currentProduct.images.map((_, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                      activeImageIndex === idx
                        ? "border-white"
                        : "border-white/30"
                    )}
                  >
                    <img
                      src={currentProduct.images[idx]}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </motion.div>

              {/* Product Navigation */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                {products.map((_, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setActiveImageIndex(0);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      currentIndex === idx ? "bg-white h-8" : "bg-white/30"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col justify-center px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glassmorphism rounded-3xl p-8"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {currentProduct.title}
                </h1>
                <p className="text-xl text-gray-400 mb-8">
                  {currentProduct.description}
                </p>
              </motion.div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {currentProduct.details.map((detail, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                    <span className="text-gray-300">{detail}</span>
                  </motion.div>
                ))}
              </div>

              {/* Price and Quantity */}
              <div className="flex items-center gap-8 mb-12">
                <motion.span
                  className="text-4xl font-bold"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {currentProduct.price}
                </motion.span>
                <motion.div
                  className="flex items-center gap-4 glassmorphism rounded-full p-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <span className="w-8 text-center">{quantity}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Size Selection */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-lg font-medium mb-4">Select Size</h3>
                <div className="flex flex-wrap gap-4">
                  {currentProduct.sizes.map((size) => (
                    <motion.button
                      key={size}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-6 py-3 rounded-full transition-colors",
                        selectedSize === size
                          ? "border-2 border-white bg-white text-black"
                          : "glassmorphism hover:bg-white/10"
                      )}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Color Selection */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-lg font-medium mb-4">Select Color</h3>
                <div className="flex flex-wrap gap-4">
                  {currentProduct.colors.map((color) => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "w-12 h-12 rounded-2xl transition-all",
                        selectedColor === color
                          ? "ring-2 ring-offset-4 ring-offset-[#0A0A0B] ring-white"
                          : ""
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex-1 py-4 rounded-full font-medium transition-all",
                    selectedSize && selectedColor && currentProduct.inStock
                      ? "bg-white text-black hover:bg-gray-100"
                      : "bg-white/20 text-white/50 cursor-not-allowed"
                  )}
                  disabled={
                    !selectedSize || !selectedColor || !currentProduct.inStock
                  }
                >
                  {currentProduct.inStock
                    ? `Add to Cart (${quantity})`
                    : "Out of Stock"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-4 rounded-full glassmorphism hover:bg-white/10"
                >
                  <Heart className="w-6 h-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-4 rounded-full glassmorphism hover:bg-white/10"
                  onClick={handleShare}
                >
                  <Share2 className="w-6 h-6" />
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
