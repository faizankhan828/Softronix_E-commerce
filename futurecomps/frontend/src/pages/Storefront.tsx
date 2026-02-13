import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { NewArrivals } from "@/components/NewArrivals";
import { Categories } from "@/components/Categories";
import { SustainableFashion } from "@/components/SustainableFashion";
import { ShopBenefits } from "@/components/ShopBenefits";
import Newsletter from "@/components/Newsletter";

// Hero slides data
const heroSlides = [
  {
    title: "Discover Premium Products",
    subtitle: "SPRING COLLECTION 2024",
    description: "Experience shopping like never before with AI-powered assistance",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920",
    cta: "Shop Now",
    ctaLink: "/shop",
  },
  {
    title: "Smart Shopping Experience",
    subtitle: "AI-POWERED ASSISTANCE",
    description: "Let our AI Clerk help you find the perfect products",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1920",
    cta: "Try AI Chat",
    ctaLink: "/shop",
  },
  {
    title: "Exclusive Deals",
    subtitle: "UP TO 50% OFF",
    description: "Chat with our AI to negotiate special discounts",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920",
    cta: "View Deals",
    ctaLink: "/shop?sale=true",
  },
];

export function Storefront() {
  const [currentSlide, setCurrentSlide] = useState(0);

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
      <div className="bg-white dark:bg-gray-900">
        {/* Hero Carousel */}
        <section className="relative h-[60vh] min-h-[400px] max-h-[700px] overflow-hidden">
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
                      <div className="max-w-xl text-white">
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-sm font-semibold tracking-widest mb-4 text-blue-400"
                        >
                          {slide.subtitle}
                        </motion.p>
                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
                        >
                          {slide.title}
                        </motion.h1>
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-base text-gray-300 mb-6"
                        >
                          {slide.description}
                        </motion.p>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Button asChild size="lg">
                            <Link to={slide.ctaLink}>
                              {slide.cta}
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
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentSlide
                    ? "w-6 bg-white"
                    : "bg-white/50 hover:bg-white/75"
                )}
              />
            ))}
          </div>
        </section>

        {/* Shop Benefits Bar - like mamo */}
        <ShopBenefits />

        {/* New Arrivals / Featured Products */}
        <NewArrivals />

        {/* Categories */}
        <Categories />

        {/* Sustainable Section */}
        <SustainableFashion />

        {/* Newsletter */}
        <Newsletter />
      </div>
    </MainLayout>
  );
}
