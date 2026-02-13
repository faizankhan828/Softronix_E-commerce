import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Truck,
  Shield,
  Headphones,
  RefreshCw,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

// Hero slides data
const heroSlides = [
  {
    title: "Discover Premium Products",
    subtitle: "SPRING COLLECTION 2024",
    description: "Experience shopping like never before with AI-powered assistance",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920",
    cta: "Shop Now",
    ctaLink: "/shop",
    accent: "from-primary to-blue-600",
  },
  {
    title: "Smart Shopping Experience",
    subtitle: "AI-POWERED ASSISTANCE",
    description: "Let our AI Clerk help you find the perfect products",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1920",
    cta: "Try AI Chat",
    ctaLink: "/shop",
    accent: "from-purple-600 to-pink-600",
  },
  {
    title: "Exclusive Deals",
    subtitle: "UP TO 50% OFF",
    description: "Chat with our AI to negotiate special discounts",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920",
    cta: "View Deals",
    ctaLink: "/shop?sale=true",
    accent: "from-amber-500 to-orange-600",
  },
];

// Benefits data
const benefits = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% secure checkout",
  },
  {
    icon: Headphones,
    title: "AI Support",
    description: "24/7 chat assistance",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "30-day return policy",
  },
];

// Categories
const categories = [
  {
    name: "Electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500",
    count: 42,
  },
  {
    name: "Clothing",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500",
    count: 156,
  },
  {
    name: "Home & Garden",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=500",
    count: 89,
  },
  {
    name: "Sports",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500",
    count: 67,
  },
];

export function Storefront() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { featuredProducts, loading } = useStore();

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  return (
    <MainLayout>
      {/* Hero Carousel */}
      <section className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
        <AnimatePresence mode="wait">
          {heroSlides.map(
            (slide, index) =>
              index === currentSlide && (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0"
                >
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${slide.image})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="relative h-full container mx-auto px-4 flex items-center">
                    <div className="max-w-2xl text-white">
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={cn(
                          "text-sm font-semibold tracking-widest mb-4 bg-gradient-to-r bg-clip-text text-transparent",
                          slide.accent
                        )}
                      >
                        {slide.subtitle}
                      </motion.p>
                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                      >
                        {slide.title}
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-gray-300 mb-8"
                      >
                        {slide.description}
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button asChild size="xl" variant="gradient">
                          <Link to={slide.ctaLink}>
                            {slide.cta}
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Link>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentSlide
                  ? "w-8 bg-white"
                  : "bg-white/50 hover:bg-white/75"
              )}
            />
          ))}
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="bg-white dark:bg-gray-800 border-b py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Featured Products</h2>
              <p className="text-muted-foreground mt-1">
                Handpicked items just for you
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/shop">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
              : featuredProducts.slice(0, 8).map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Shop by Category</h2>
            <p className="text-muted-foreground mt-2">
              Browse our wide selection of products
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/shop?category=${category.name.toLowerCase()}`}
                  className="group block relative aspect-[4/3] rounded-2xl overflow-hidden"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                    <p className="text-white/80 text-sm">{category.count} products</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Clerk CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-blue-600">
        <div className="container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI-Powered Shopping</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Shop Without Clicking
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Our AI Clerk can help you discover products, add items to cart,
              apply discounts, and even negotiate special deals - all through natural conversation.
            </p>
            <Button
              size="xl"
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Chatting
            </Button>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
