import { motion } from "framer-motion";
import { ShieldCheck, RefreshCw, Truck } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const benefits = [
  {
    icon: <Truck size={36} />,
    title: "Free Shipping",
    description: "Free shipping on all orders over $100",
  },
  {
    icon: <RefreshCw size={36} />,
    title: "Free Returns",
    description: "30-day return policy for all items",
  },
  {
    icon: <ShieldCheck size={36} />,
    title: "Secure Checkout",
    description: "Safe & protected online shopping experience",
  },
];

export default function ShopBenefits() {
  const { theme } = useTheme();

  // Adjust colors based on theme
  const bgColor = theme === "dark" ? "#1F2937" : "#171717"; // dark:bg-gray-800 or bg-neutral-900

  return (
    <section
      className="py-12 sm:py-16 lg:py-20 text-white"
      style={{ backgroundColor: bgColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center p-4 sm:p-6"
            >
              <div className="mb-3 sm:mb-4 text-gray-300 [&>svg]:w-8 [&>svg]:h-8 sm:[&>svg]:w-9 sm:[&>svg]:h-9">
                {benefit.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
