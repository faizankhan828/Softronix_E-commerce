import { motion } from "framer-motion";
import { ShieldCheck, RefreshCw, Truck, Headphones } from "lucide-react";

const benefits = [
  {
    icon: <Truck size={24} />,
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Secure Payment",
    description: "100% secure checkout",
  },
  {
    icon: <Headphones size={24} />,
    title: "AI Support",
    description: "24/7 chat assistance",
  },
  {
    icon: <RefreshCw size={24} />,
    title: "Easy Returns",
    description: "30-day return policy",
  },
];

export function ShopBenefits() {
  return (
    <section className="py-8 border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-3"
            >
              <div className="text-gray-700 dark:text-gray-300">
                {benefit.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {benefit.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
